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
    req.token = token
    next();
  }
);

export const getItems = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await pool.query("SELECT * FROM carts WHERE user_id=$1", [
      req.user.id,
    ]);
    const items = result.rows;

    return res.status(200).json({
      status: "success",
      result: items.length,
      data: items,
    });
  }
);

export const getItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    const result = await pool.query("SELECT * FROM carts WHERE id=$1", [id]);
    const item = result.rows[0];

    if (!item) {
      return next(new AppError("Failed to find item matching that id", 404));
    }

    return res.status(200).json({
      status: "success",
      data: item,
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

    const result = await client.query(
      "INSERT INTO carts (product_id, user_id, quantity) VALUES ($1, $2, $3) RETURNING *",
      [data.data.id, req.user.id, 1]
    );

    await client.query("COMMIT");
    const item = result.rows[0];
    return res.status(201).json({
      status: "success",
      data: item,
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
