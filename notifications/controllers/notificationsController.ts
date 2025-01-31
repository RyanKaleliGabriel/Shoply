import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import twilio from "twilio";
import Email from "../utils/email";

const USER_URL = process.env.USER_URL;
const ORDER_URL = process.env.ORDER_URL;
const PAYMENT_URL = process.env.PAYMENT_URL;
const accountSid = process.env.TWILLO_ACCOUNT_SID;
const authToken = process.env.TWILLO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

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

    if (!response.ok) {
      return next(new AppError("Failed to authenticate user. Try again.", 403));
    }

    const data = await response.json();
    req.user = data.data;
    req.token = token;
    next();
  }
);

export const createMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const message = await client.messages.create({
      body: "This is the ship that made the Kessel Run in fourteen parsecs?",
      from: "+18483455315",
      to: "0704383812",
    });

    return res.status(201).json({
      status: "success",
      data: message.body,
    });
  }
);

export const sendReceipt = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.orderId;
    const token = req.token;
    // GET  ORDER
    const responseOrder = await fetch(`${ORDER_URL}/api/v1/orders/${orderId}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!responseOrder.ok) {
      return next(new AppError("Failed to fetch order. Try again.", 500));
    }

    const resultOrder = await responseOrder.json();
    const order = resultOrder.data;
    // GET transactions and filter with the orderId
    const responseTransactions = await fetch(
      `${PAYMENT_URL}/api/v1/payments/transactions/`,
      {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!responseTransactions.ok) {
      return next(new AppError("Failed to fetch order. Try again.", 500));
    }

    const resultTransactions = await responseTransactions.json();
    const transactions = resultTransactions.data;
    const userTransaction = transactions.find(
      (transaction: any) => transaction.order_id === order.id
    );

    // Send the email
    await new Email(req.user, order, userTransaction).sendReceipt();

    //Return a success message

    return res.status(200).json({
      status: "success",
      data: {
        message: "Email sent successfully",
        order,
        transaction: userTransaction,
        user: req.user,
      },
    });
  }
);
