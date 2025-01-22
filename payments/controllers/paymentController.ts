import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { getTimestamp } from "../utils/getTimestamp";
import dotenv from "dotenv";
import AppError from "../utils/appError";
import axios from "axios";
import ngrok from "ngrok";

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
    const { amount, phone, orderId } = req.body;
    console.log(req.body)
    const url =
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const auth = `Bearer ${req.safaricomAccessToken}`;
    console.log(auth)

    const timestamp = getTimestamp();

    const password = Buffer.from(
      process.env.BUSINESS_SHORTCODE! + process.env.PASS_KEY + timestamp
    ).toString("base64");

    const callback_url = await ngrok.connect(Number(process.env.PORT_PAYMENT));
    const api = ngrok.getApi()
    await api?.listTunnels()

    const payload = {
      BusinessShortCode: process.env.BUSINESS_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPaybillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.BUSINESS_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: `${callback_url}/api/v1/payments/${orderId}`,
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

    console.log(req.safaricomAccessToken)

    return res.status(201).json({
      status: "success",
      data: "Works"
    });
  }
);

export const confirmPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);
