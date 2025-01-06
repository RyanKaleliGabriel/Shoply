import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import pool from "../db/con";
import AppError from "../utils/appError";
import validator from "validator";

export const getAllProducts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
        // Implement pagination, filtering and sorting.
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
  async (req: Request, res: Response, next: NextFunction) => {



    // Create a product with the category. 
    
    // Category id must be in the category table
  }
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
  async (req: Request, res: Response, next: NextFunction) => {
    // Update everything
    //Check if the current category id has changed
    
  }
);

// Categories
export const getAllCategories = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await pool.query("SELECT * FROM categories");
    const categories = result.rows;

    return res.status(200).json({
      status: "success",
      results: categories.length,
      data: {
        data: categories,
      },
    });
  }
);

export const getCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    const result = await pool.query("SELECT * FROM categories WHERE id=$1", [
      id,
    ]);
    const category = result.rows[0];

    if (!category) {
      return next(new AppError("No category matching that id", 404));
    }

    return res.status(200).json({
      status: "success",
      data: {
        data: category,
      },
    });
  }
);

export const createCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const name = req.body.name;

    if (!name || typeof name !== "string" || validator.isEmpty(name.trim())) {
      return next(new AppError("Incorrect name format", 400));
    }

    const result = await pool.query(
      "INSERT INTO categories (name) VALUES ($1) RETURNING *",
      [name]
    );
    const newCategory = result.rows[0];

    return res.status(201).json({
      status: "success",
      data: {
        data: newCategory,
      },
    });
  }
);

export const updateCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const name = req.body.name;

    if (!name || typeof name !== "string" || validator.isEmpty(name.trim())) {
      return next(new AppError("Incorrect name format", 400));
    }

    const result = await pool.query(
      "UPDATE categories set name=$2 WHERE id=$1 RETURNING *",
      [id, name]
    );
    const updatedCategory = result.rows[0];

    return res.status(201).json({
      status: "success",
      data: {
        data: updatedCategory,
      },
    });
  }
);

export const deleteCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await pool.query("DELETE FROM categories WHERE id=$1", [id]);
    const category = result.rows[0];

    return res.status(204).json({
      status: "success",
      data: null,
    });
  }
);
