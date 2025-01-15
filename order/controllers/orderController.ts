import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import pool from "../db/con";
import AppError from "../utils/appError";

const BASE_URL = process.env.BASE_URL;

export const getOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = 1;

    const result = await pool.query(
      `
      SELECT o.id AS order_id,
      o.status,
      o.created_at,
      po.product_id,
      po.quantity,
      p.name as product_name,
      p.price AS product_price
      FROM orders o
      JOIN
          product_order po ON o.id = po.order_id
      JOIN 
          products p ON po.product_id = p.id
      WHERE 
          o.user_id = $1
      ORDER BY
           o.created_at DESC;
      `,
      [userId]
    );

    const orders = result.rows;
  }
);

export const getOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);

export const createOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const response = await fetch(`${BASE_URL}/api/v1/users/getMe`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // if (!response.ok) {
    //   return next(
    //     new AppError("You are not authenticated to perform this action", 403)
    //   );
    // }

    const data = await response.json();

    // const client = await pool.connect();
    // await client.query("BEGIN");

    // const userId = 1;
    // const resultOrder = await client.query(
    //   "INSERT INTO orders (status, user_id) VALUES($1, $2) RETURNING *",
    //   ["pending", userId]
    // );

    // const { products } = req.body;

    // const values = [];
    // const placeholders = products.map(
    //   (_: any, index: any) =>
    //     `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`
    // );

    // console.log(placeholders);

    // products.forEach((product: any) => {
    //   values.push(product.id, product.quantity);
    // });

    // console.log(products);
    // await client.query("COMMIT");
    return res.status(201).json({
      status: "success",
      data,
    });
  }
);

export const deleteOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);
