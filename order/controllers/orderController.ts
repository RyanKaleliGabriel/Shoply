import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import pool from "../db/con";

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
    const client = await pool.connect();
    await client.query("BEGIN");

    const userId = 1;
    const resultOrder = await client.query(
      "INSERT INTO orders (status, user_id) VALUES($1, $2) RETURNING *",
      ["pending", userId]
    );

    const order = resultOrder.rows[0];
    const productId = req.body.productId;
    const orderId = order.id;
    const quantity = req.body.quantity;

    const productOrder = await client.query(
      "INSERT INTO product_order (product_id, quantity, order_id) VALUES($1, $2, $3)",
      [productId, quantity, orderId]
    );

    const finalOrderResult = await client.query(
      "SELECT * FROM product_order WHERE order_id=$1",
      [orderId]
    );

    await client.query("COMMIT");
    return res.status(201).json({
      status: "success",
      data: finalOrderResult.rows,
    });
  }
);

export const deleteOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);
