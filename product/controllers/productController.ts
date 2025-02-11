import { NextFunction, Request, Response } from "express";
import pool from "../db/con";
import APIfeatures from "../utils/ApiFeatures";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import {
  checkRequiredFields,
  checkUpdateFields,
  dynamicQuery,
  updateClause,
} from "../utils/databaseFields";
import { performance } from "perf_hooks";
import {
  dbQueryDurationHistogram,
  requestCounter,
} from "../middleware/prometheusMiddleware";

export const getProducts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const dbQueryStart = performance.now();
    // Implement pagination, filtering and sorting.
    const baseQuery = "SELECT * FROM products";
    const features = new APIfeatures(baseQuery, req.query);
    features.filter().sort().limitFields().paginate();

    const result = await pool.query(features.query, features.values);

    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);

    requestCounter.labels(req.method, req.originalUrl).inc();

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
    const dbQueryStart = performance.now();

    const result = await pool.query("SELECT * FROM products WHERE id=$1", [id]);
    const product = result.rows[0];

    if (!product) {
      return next(new AppError("No product found with that id", 404));
    }

    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);
    requestCounter.labels(req.method, req.originalUrl).inc();
    return res.status(200).json({
      status: "success",
      data: product,
    });
  }
);

export const createProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const requiredFields = [
      "name",
      "category_id",
      "price",
      "description",
      "stock",
    ];
    const productData = req.body;

    // Validators
    checkRequiredFields(requiredFields, productData, next);

    const dbQueryStart = performance.now();
    //Check if category exists
    const categoryResult = await pool.query(
      "SELECT * FROM categories WHERE id=$1",
      [productData.category_id]
    );
    const category = categoryResult.rows[0];
    if (!category) {
      return next(new AppError("No category matching that id", 404));
    }

    //Dynamically build the query
    const { keys, values, placeholders } = dynamicQuery(productData);

    // Create a product with the category.
    const result = await pool.query(
      `INSERT INTO products (${keys.join(
        ", "
      )}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    const product = result.rows[0];
    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);

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
    requestCounter.labels(req.method, req.originalUrl).inc();
    return res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

export const updateProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const updates = req.body;
    const { id } = req.params;

    checkUpdateFields(updates, next);
    const { setClause, values } = updateClause(updates, id, next);

    // Create a product with the category.
    const result = await pool.query(
      `UPDATE products set  ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );

    const product = result.rows[0];
    return res.status(201).json({
      status: "success",
      data: product,
    });
  }
);

// Categories
export const getCategories = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const dbQueryStart = performance.now();
    const result = await pool.query("SELECT * FROM categories");
    const categories = result.rows;

    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);
    requestCounter.labels(req.method, req.originalUrl).inc();
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

    const dbQueryStart = performance.now();
    const result = await pool.query("SELECT * FROM categories WHERE id=$1", [
      id,
    ]);
    const category = result.rows[0];

    if (!category) {
      return next(new AppError("No category matching that id", 404));
    }

    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);
    requestCounter.labels(req.method, req.originalUrl).inc();

    return res.status(200).json({
      status: "success",
      data: category,
    });
  }
);

export const createCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const requiredFields = ["name"];
    const categoryData = req.body;

    //Validate required fields
    checkRequiredFields(requiredFields, categoryData, next);

    //Dynamically build the query
    const { keys, values, placeholders } = dynamicQuery(categoryData);
    const dbQueryStart = performance.now();
    const result = await pool.query(
      `INSERT INTO categories (${keys.join(
        ", "
      )}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    const newCategory = result.rows[0];

    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);

    return res.status(201).json({
      status: "success",
      data: newCategory,
    });
  }
);

export const updateCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const updates = req.body;

    checkUpdateFields(updates, next);
    const { setClause, values } = updateClause(updates, id, next);

    const dbQueryStart = performance.now();
    const result = await pool.query(
      `UPDATE categories set ${setClause} WHERE id=$${values.length} RETURNING *`,
      values
    );
    const updatedCategory = result.rows[0];

    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);
    return res.status(201).json({
      status: "success",
      data: updatedCategory,
    });
  }
);

export const deleteCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await pool.query("DELETE FROM categories WHERE id=$1", [id]);

    requestCounter.labels(req.method, req.originalUrl).inc();
    return res.status(204).json({
      status: "success",
      data: null,
    });
  }
);
