import axios from "axios";
import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { getTimestamp } from "../utils/getTimestamp";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const ORDER_URL = process.env.ORDER_URL;

interface MetaItem {
  name: string;
  Value: string | number;
}

dotenv.config();
const USER_URL = process.env.USER_URL;

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

    return res.status(201).json({
      status: "success",
      data: response.data,
    });
  }
);

export const stkPushCallback = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
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

    // Do something with the data
    console.log("-".repeat(20), " OUTPUT IN THE CALLBACK ", "-".repeat(20));
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
    console.log(data);

    return res.status(201).json({
      status: "success",
      data,
    });
  }
);

export const confirmPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const url = "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";
    const auth = "Bearer " + req.safaricomAccessToken;

    const timestamp = getTimestamp();
    console.log(process.env.PASS_KEY);
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
      success_url: `http://127.0.0.1/api/v1/payments/success`,
      cancel_url: "http://127.0.0.1/api/v1/payments/cancel",
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

    res.status(200).json({
      status: "success",
      session: checkoutSession,
    });
  }
);

export const stripeSuccess = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // save to db

    // Update the order to paid

    // Clear the cart

    res.status(200).json({
      status: "success",
      data: {
        message: "Payment successful",
      },
    });
  }
);

export const cancelPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      status: "success",
      data: {
        message: "Payment canceled by user.",
      },
    });
  }
);
