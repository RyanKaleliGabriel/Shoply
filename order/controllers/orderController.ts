import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import pool from "../db/con";
import AppError from "../utils/appError";

const USER_URL = process.env.USER_URL;
const PRODUCT_URL = process.env.PRODUCT_URL;
const CART_URL = process.env.CART_URL;

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

export const getOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user.id;
    const result = await pool.query("SELECT * FROM orders WHERE user_id=$1", [
      user,
    ]);
    const orders = result.rows;
    return res.status(200).json({
      status: "success",
      result: orders.length,
      data: orders,
    });
  }
);

export const getOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user.id;

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

export const createOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.token;
    // Fetch Items in the cart
    // Fetch the cart with the products associated with the user.
    const response = await fetch(`${CART_URL}/api/v1/cart/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    const items = data.data;

    // Confirm if the user has something in the cart.
    if (items === 0) {
      return next(new AppError("No items found in cart", 403));
    }

    const resultOrder = await pool.query(
      "INSERT INTO orders (status, user_id) VALUES($1, $2) RETURNING *",
      ["pending", req.user.id]
    );
    const order: any = resultOrder.rows[0];

    const values: any = [];
    const placeholders = items.map(
      (_: any, index: any) =>
        `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`
    );

    items.forEach((item: any) => {
      values.push(item.product_id, item.quantity, order.id);
    });

    const client = await pool.connect();
    await client.query("BEGIN");

    // Place the order
    const query = `INSERT INTO product_order (product_id, quantity, order_id) VALUES ${placeholders} RETURNING *`;
    const result = await pool.query(query, values);
    await client.query("COMMIT");
    return res.status(201).json({
      status: "success",
      data: result.rows,
    });

    // Initiate Payment Process -
    // Verify Payment Status - If payment is successful, update the order to "paid" status. If payment fails, keep the order as "pending", allowing a retry.
    // Clear the Cart (Only After Payment Success) After a successful payment, delete the cart items but keep the order record.
  }
);

export const deleteOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);
