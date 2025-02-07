import { NextFunction, Request, Response } from "express";
import pool from "../db/con";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { checkUpdateFields, updateClause } from "../utils/databaseFields";

const USER_URL = process.env.USER_URL;
const PRODUCT_URL = process.env.PRODUCT_URL;
const CART_URL = process.env.CART_URL;


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

    const id = req.params.id;
    const client = await pool.connect();

    await client.query("BEGIN");

    const resultOrder = await client.query("SELECT * FROM orders WHERE id=$1", [
      id,
    ]);
    const order = resultOrder.rows[0];

    if (!order) {
      return next(new AppError("No order matching that id", 404));
    }

    const result = await client.query(
      "SELECT * FROM product_order WHERE order_id=$1",
      [order.id]
    );

    const orders = result.rows;

    const ordersWithProducts = orders.map((order: any) => {
      const product = products.find(
        (product: any) => product.id === order.product_id
      );
      return {
        ...order,
        productName: product.name,
        productPrice: product.price,
      };
    });
    await client.query("COMMIT");

    return res.status(200).json({
      status: "success",
      data: {
        id: order.id,
        products: ordersWithProducts,
        total_amount: order.total_amount,
      },
    });
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
    const items = data.data.items;

    // Confirm if the user has something in the cart.
    if (items === 0) {
      return next(new AppError("No items found in cart", 403));
    }

    const total_amount = items.reduce(
      (accumulator: number, currentValue: any) =>
        accumulator + currentValue.price * currentValue.quantity,
      0
    );

    const resultOrder = await pool.query(
      "INSERT INTO orders (status, user_id, total_amount) VALUES($1, $2, $3) RETURNING *",
      ["pending", req.user.id, total_amount]
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
      data: {
        order_id: order.id,
        products: result.rows,
        total_amount,
      },
    });
  }
);

export const deleteOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const client = await pool.connect();
    await client.query("BEGIN");

    const resultOrder = await client.query("SELECT * FROM orders WHERE id=$1", [
      id,
    ]);
    const order = resultOrder.rows[0];

    if (!order) {
      return next(new AppError("No order matching that id", 404));
    }
    await client.query("DELETE FROM orders WHERE id=$1", [order.id]);

    await client.query("COMMIT");
    return res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

export const updateOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const updates = req.body;

    checkUpdateFields(updates, next);
    const { setClause, values } = updateClause(updates, id, next);

    const client = await pool.connect();
    await client.query("BEGIN");

    const resultOrder = await client.query("SELECT * FROM orders WHERE id=$1", [
      id,
    ]);
    const order = resultOrder.rows[0];

    if (!order) {
      return next(new AppError("No order matching that id", 404));
    }
    const result = await client.query(
      `UPDATE orders SET ${setClause} WHERE id=$${values.length} RETURNING *`,
      values
    );

    await client.query("COMMIT");
    return res.status(201).json({
      status: "success",
      data: result.rows,
    });
  }
);
