import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import pool from "../db/con";
import AppError from "../utils/appError";
import { numberValidator } from "../utils/validators";

const USER_URL = process.env.USER_URL;
const PRODUCT_URL = process.env.PRODUCT_URL;

export const authenticated = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token =
      req.headers.cookie?.split("=").at(1) ||
      req.headers.authorization?.split(" ").at(1);
    const response = await fetch(`${USER_URL}/api/v1/users/getMe`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(response);

    if (!response.ok) {
      return next(new AppError("Failed to authenticate user. Try again.", 403));
    }

    const data = await response.json();
    req.user = data.data;
    req.token = token;
    next();
  }
);

export const getItems = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await pool.query("SELECT * FROM carts WHERE user_id=$1", [
      req.user.id,
    ]);
    const items = result.rows;
    const total_amount = items.reduce(
      (accumulator, currentValue) =>
        accumulator + currentValue.price * currentValue.quantity,
      0
    );

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

    return res.status(200).json({
      status: "success",
      result: mergedItems.length,
      data: { items: mergedItems, total_amount },
    });
  }
);

export const addItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get the productId.
    const { productId } = req.body;
    numberValidator(productId, "Product", next);

    // AUthenticate the product using the productId
    const response = await fetch(
      `${PRODUCT_URL}/api/v1/products/${productId}`,
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

    console.log(data.data);

    const result = await client.query(
      "INSERT INTO carts (product_id, user_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *",
      [data.data.id, req.user.id, 1, data.data.price]
    );

    await client.query("COMMIT");
    const item = result.rows[0];
    return res.status(201).json({
      status: "success",
      data: item,
    });
  }
);

export const updateItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    const client = await pool.connect();
    await client.query("BEGIN");

    const resultItem = await client.query("SELECT * FROM carts WHERE id=$1", [
      id,
    ]);
    const item = resultItem.rows[0];
    if (!item) {
      return next(new AppError("No item matching that id", 404));
    }

    const result = await client.query(
      "UPDATE carts SET quantity=$1 WHERE id=$2 RETURNING *",
      [req.body.quantity, item.id]
    );
    const updatedItem = result.rows[0];

    await client.query("COMMIT");

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
