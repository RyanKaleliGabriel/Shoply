import axios from "axios";
import { NextFunction, Request, Response } from "express";
import Stripe from "stripe";
import pool from "../db/con";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { getTimestamp } from "../utils/getTimestamp";
import { afterPaymentOperations } from "../middlewares/paymentMiddleware";
import {
  dbQueryDurationHistogram,
  requestCounter,
} from "../middlewares/prometheusMiddleware";
import { performance } from "perf_hooks";
import { logger } from "../middlewares/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const ORDER_URL = process.env.ORDER_URL;

interface MetaItem {
  name: string;
  Value: string | number;
}

export const intiateSTKPush = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { amount, phone } = req.body;
    const url =
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const auth = `Bearer ${req.safaricomAccessToken}`;
    const timestamp = getTimestamp();

    const password = Buffer.from(
      Number(process.env.BUSINESS_SHORTCODE) + process.env.PASS_KEY! + timestamp
    ).toString("base64");
    const callback_url = "https://7fdc-102-215-189-77.ngrok-free.app";

    const payload = {
      BusinessShortCode: Number(process.env.BUSINESS_SHORTCODE),
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: Number(process.env.BUSINESS_SHORTCODE),
      PhoneNumber: phone,
      CallBackURL: `${callback_url}/api/v1/payments/stkPushCallback`,
      AccountReference: "Shoply",
      TransactionDesc: "Paid online",
    };

    const response = await axios.post(url, payload, {
      headers: { Authorization: auth },
    });
    logger.info(`Post request for intiating stkpush sent to daraja sandbox`);
    requestCounter.labels(req.method, req.originalUrl).inc();

    logger.info("Mpesa STK push successfully intiated");
    return res.status(201).json({
      status: "success",
      data: response.data,
    });
  }
);

export const stkPushCallback = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body.Body.stkCallback) {
      return new AppError("Mpesa callback not received. Try again", 500);
    }

    const orderId = req.params.orderId;
    const token = req.token;
    const userId = req.user.id;
    logger.info("Mpesa callback successfully received");

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetdata,
    } = req.body.Body.stkCallback;

    // Get the meta data from the meta
    const meta: MetaItem[] = Object.values(await CallbackMetdata.Item);
    const PhoneNumber = meta
      .find((o) => o.name === "PhoneNumber")
      ?.Value.toString();
    const Amount = meta.find((o) => o.name === "Amount")?.Value.toString();
    const MpesaReceiptNumber = meta
      .find((o) => o.name === "MpesaReceiptNumber")
      ?.Value.toString();
    const TransactionDate = meta
      .find((o) => o.name === "TransactionDate")
      ?.Value.toString();

    const data = {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      PhoneNumber,
      Amount,
      MpesaReceiptNumber,
      TransactionDate,
    };

    const dbQueryStart = performance.now();

    // Save transaction to database
    const client = await pool.connect();
    await client.query("BEGIN");

    const resultTransaction = await client.query(
      "INSERT INTO transactions (user_id, order_id, amount, currency, status, payment_method, provider_metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        req.user.id,
        req.params.orderId,
        Amount,
        "kes",
        "completed",
        "mpesa",
        data,
      ]
    );
    const transaction = resultTransaction.rows[0];
    await client.query("COMMIT");

    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);

    return res.status(201).json({
      status: "success",
      data: transaction,
    });
  }
);

export const confirmPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const url = "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";
    const auth = "Bearer " + req.safaricomAccessToken;

    const timestamp = getTimestamp();
    const password = Buffer.from(
      Number(process.env.BUSINESS_SHORTCODE) + process.env.PASS_KEY! + timestamp
    ).toString("base64");

    const payload = {
      BusinessShortCode: Number(process.env.BUSINESS_SHORTCODE),
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: req.params.CheckoutRequestID,
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: auth,
      },
    });
    logger.info("Post request for payment confimation successfully hit.");

    requestCounter.labels(req.method, req.originalUrl).inc();
    logger.info("Mpesa payment successfully received");

    return res.status(201).json({
      status: "success",
      data: response,
    });
  }
);

export const checkoutStripe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const orderId = req.params.orderId;

    // Fetch the order.
    const responseOrder = await fetch(`${ORDER_URL}/api/v1/orders/${orderId}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${req.token}`,
      },
    });

    if (!responseOrder.ok) {

      return next(
        new AppError(
          "Failed to fetch order. Please try again later",
          responseOrder.status
        )
      );
    }

    const data = await responseOrder.json();
    const order = data.data;
    const amount = Math.ceil(order.total_amount / 130);

    const params: Stripe.Checkout.SessionCreateParams = {
      success_url: `http://127.0.0.1/api/v1/payments/stripe/success/${orderId}`,
      cancel_url: "http://127.0.0.1/api/v1/payments/stripe/cancel",
      customer_email: user.email,
      client_reference_id: order.id,
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            unit_amount: amount * 100,
            currency: "usd",
            product_data: {
              name: `Order No ${order.id}`,
              description: `Shoply purchase for order ${order.id}`,
            },
          },
        },
      ],
    };
    const checkoutSession: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create(params);
    logger.info("Stripe session successfully created")

    const dbQueryStart = performance.now();

    // save to db
    const client = await pool.connect();
    await client.query("BEGIN");

    const resultTransaction = await client.query(
      "INSERT INTO transactions (user_id, order_id, amount, currency, status, payment_method) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [user.id, orderId, amount, "usd", "completed", "stripe"]
    );
    const transaction = resultTransaction.rows[0];
    await client.query("COMMIT");

    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);
    requestCounter.labels(req.method, req.originalUrl).inc();

    logger.info("Stripe session created successfully")
    res.status(200).json({
      status: "success",
      session: checkoutSession,
    });
  }
);

export const stripeSuccess = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.orderId;
    const token = req.token;
    const userId = req.user.id;
    await afterPaymentOperations(next, orderId, token, userId);

    requestCounter.labels(req.method, req.originalUrl).inc();

    logger.info("Stripe payment was successful")
    res.status(200).json({
      status: "success",
      data: {
        message: "Payment successful",
      },
    });
  }
);

export const stripeCancel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    requestCounter.labels(req.method, req.originalUrl).inc();
    logger.info("Stripe payment was cancelled")
    res.status(200).json({
      status: "success",
      data: {
        message: "Payment canceled by user.",
      },
    });
  }
);

export const getTransactions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const client = await pool.connect();

    const dbQueryStart = performance.now();

    await client.query("BEGIN");
    const results = await client.query(
      "SELECT * FROM transactions WHERE user_id=$1",
      [userId]
    );
    const transactions = results.rows;
    await client.query("COMMIT");

    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);
    requestCounter.labels(req.method, req.originalUrl).inc();

    return res.status(200).json({
      status: "success",
      data: transactions,
    });
  }
);

export const getTransaction = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    const dbQueryStart = performance.now();

    const client = await pool.connect();
    await client.query("BEGIN");
    const results = await client.query(
      "SELECT * FROM transactions WHERE id=$1",
      [id]
    );
    const transaction = results.rows[0];
    await client.query("COMMIT");

    const dbQueryDuration = (performance.now() - dbQueryStart) / 1000;
    dbQueryDurationHistogram
      .labels(req.method, req.originalUrl)
      .observe(dbQueryDuration);
    requestCounter.labels(req.method, req.originalUrl).inc();

    return res.status(200).json({
      status: "success",
      data: transaction,
    });
  }
);
