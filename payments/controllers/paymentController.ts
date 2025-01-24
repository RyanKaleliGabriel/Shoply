import axios from "axios";
import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { getTimestamp } from "../utils/getTimestamp";

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
    console.log(process.env.PASS_KEY)
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
