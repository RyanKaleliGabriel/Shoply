import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import pool from "../db/con";
import AppError from "../utils/appError";
import validator from "validator";
import { numberValidator, stringValidator } from "../utils/validators";
import APIfeatures from "../utils/ApiFeatures";

export const getAllProducts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Implement pagination, filtering and sorting.
    const baseQuery = "SELECT * FROM products";
    const features = new APIfeatures(baseQuery, req.query);
    features.filter().sort().limitFields().paginate();

    const result = await pool.query(features.query, features.values);

    return res.status(200).json({
      status: "success",
      result: result.rows.length,
      data: result.rows,
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
      data: product,
    });
  }
);

export const createProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, categoryId, price, description, stock } = req.body;

    stringValidator(name, "Name", next);
    stringValidator(description, "Description", next);
    numberValidator(price, "Price", next);
    numberValidator(categoryId, "Category", next);
    numberValidator(stock, "Stock", next);

    const categoryResult = await pool.query(
      "SELECT * FROM categories WHERE id=$1",
      [categoryId]
    );
    const category = categoryResult.rows[0];
    if (!category) {
      return next(new AppError("No category matching that id", 404));
    }

    // Create a product with the category.
    const result = await pool.query(
      "INSERT INTO products (name, category_id, price, description, stock) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [name, category.id, price, description, stock]
    );

    const product = result.rows[0];
    return res.status(201).json({
      status: "success",
      data: product,
    });
  }
);

export const deleteProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    await pool.query("DELETE FROM products WHERE id=$1", [id]);
    return res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

export const updateProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, categoryId, price, description } = req.body;

    stringValidator(name, "Name", next);
    stringValidator(description, "Description", next);
    numberValidator(price, "Price", next);
    numberValidator(categoryId, "Category", next);

    const categoryResult = await pool.query(
      "SELECT * FROM categories WHERE id=$1",
      [categoryId]
    );

    const category = categoryResult.rows[0];
    if (!category) {
      return next(new AppError("No category matching that id", 404));
    }

    // Create a product with the category.
    const result = await pool.query(
      "UPDATE products set name=$1, category_id=$2, price=$3, description=$4 WHERE id=$5 RETURNING *",
      [name, category.id, price, description, req.params.id]
    );

    const product = result.rows[0];
    return res.status(201).json({
      status: "success",
      data: product,
    });
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
      data: categories,
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
      data: category,
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
      data: newCategory,
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
      data: updateCategory,
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
