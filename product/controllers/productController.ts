import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import pool from "../db/con";
import AppError from "../utils/appError";

export const getAllProducts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await pool.query("SELECT * FROM products");
    const products = result.rows[0];
    return res.status(200).json({
      status: "success",
      result: products.length,
      data: { data: products },
    });
  }
);

export const getProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await pool.query("SELECT * FROM products WHERE id=$1", [id]);
    const product = result.rows[0];

    if (!product) {
      return next(new AppError("No product found with that id", 404));
    }

    return res.status(200).json({
      status: "success",
      data: {
        data: product,
      },
    });
  }
);

export const createProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);

export const deleteProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await pool.query("DELETE FROM users WHERE id=$1", [id]);
    const product = result.rows[0];
    if (!product) {
      return next(new AppError("No product found with that id", 404));
    }

    return res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

export const updateProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);
