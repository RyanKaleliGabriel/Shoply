import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import pool from "../db/con";
import AppError from "../utils/appError";
import { numberValidator } from "../utils/validators";

export const getItems = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = 1;
    const resultUser = await pool.query("SELECT * FROM users WHERE id=$1", [
      userId,
    ]);
    const user = resultUser.rows[0];

    if (!user) {
      return next(new AppError("User not authenticated", 401));
    }

    const result = await pool.query("SELECT * FROM carts WHERE user_id=$1", [
      userId,
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
    const { productId, user } = req.body;

    numberValidator(productId, "Product", next);

    const productResult = await pool.query(
      "SELECT * FROM categories WHERE id=$1",
      [productId]
    );
    const product = productResult.rows[0];
    if (!product) {
      return next(new AppError("No product matching that id", 404));
    }

    const result = await pool.query(
      "INSERT INTO carts (product_id, user_id) VALUES ($1, $2) RETURNING *",
      [productId, user]
    );
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
