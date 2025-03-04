import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import pool from "../db/con";
import AppError from "../utils/appError";
import {
  checkRequiredFields,
  checkUpdateFields,
  updateClause,
} from "../utils/databaseFields";
import { performance } from "perf_hooks";
import {
  dbQueryDurationHistogram,
  requestCounter,
} from "../middleware/prometheusMiddleware";

const PRODUCT_URL = process.env.PRODUCT_URL;

export const getItems = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const dbQueryStart = performance.now();
    const result = await pool.query("SELECT * FROM carts WHERE user_id=$1", [
      req.user.id,
    ]);
    const items = result.rows;

    // SELECT PRODUCTS THAT MATCH THE ONES IN THE CART
    const response = await fetch(`${PRODUCT_URL}/api/v1/products/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return next(new AppError("Failed to fetch product. Try again", 404));
    }

    const data = await response.json();
    const products = data.data;

    // Return every record with a product name, price and description
    const mergedItems = items.map((item: any) => {
      const product = products.find((p: any) => p.id === item.product_id);
      return {
        ...item,
        productName: product.name,
        productDescription: product.description,
      };
    });

    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);

    return res.status(200).json({
      status: "success",
      result: mergedItems.length,
      data: { items: mergedItems },
    });
  }
);

export const addItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const requiredFields = ["product_id"];
    const cartData = req.body;
    checkRequiredFields(requiredFields, cartData, next);

    const dbQueryStart = performance.now();
    // Authenticate the product using the productId
    const response = await fetch(
      `${PRODUCT_URL}/api/v1/products/${cartData.product_id}?stock[gt]=0`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return next(new AppError("Failed to fetch product. Try again", 404));
    }

    const data = await response.json();
    // Add the product with a quantity of 1 (when updating the quantity, the update handler will work on it)
    const client = await pool.connect();

    await client.query("BEGIN");
    const resultCart = await client.query(
      "SELECT * FROM carts WHERE product_id=$1 AND user_id=$2",
      [data.data.id, req.user.id]
    );
    const existingProducts = resultCart.rows;

    if (existingProducts.length !== 0) {
      return next(new AppError("Product already exists in cart", 403));
    }

    const result = await client.query(
      "INSERT INTO carts (product_id, user_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *",
      [data.data.id, req.user.id, 1, data.data.price]
    );

    await client.query("COMMIT");
    const item = result.rows[0];

    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);

    return res.status(201).json({
      status: "success",
      data: item,
    });
  }
);

export const updateItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const updates = req.body;

    checkUpdateFields(updates, next);
    const { setClause, values } = updateClause(updates, id, next);

    const client = await pool.connect();
    const dbQueryStart = performance.now();
    await client.query("BEGIN");
    const resultItem = await client.query("SELECT * FROM carts WHERE id=$1", [
      id,
    ]);
    const item = resultItem.rows[0];
    if (!item) {
      return next(new AppError("No item matching that id", 404));
    }

    const result = await client.query(
      `UPDATE carts SET ${setClause} WHERE id=$${values.length} RETURNING *`,
      values
    );
    const updatedItem = result.rows[0];

    await client.query("COMMIT");

    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);

    return res.status(201).json({
      status: "success",
      data: updatedItem,
    });
  }
);

export const removeItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    await pool.query("DELETE FROM carts WHERE id=$1", [id]);
    return res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

export const clearCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userid;
    await pool.query("DELETE from carts WHERE user_id=$1", [userId]);
    return res.status(204).json({
      status: "success",
      data: null,
    });
  }
);


export const healthCheck = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ status: "healthy" });
  }
);
