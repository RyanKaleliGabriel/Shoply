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
    const { amount, phone } = req.body;
    const url =
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const auth = `Bearer ${req.safaricomAccessToken}`;
    const timestamp = getTimestamp();

    const password = Buffer.from(
      Number(process.env.BUSINESS_SHORTCODE) + process.env.PASS_KEY! + timestamp
    ).toString("base64");
    const callback_url = "https://1739-102-215-189-77.ngrok-free.app";

    const payload = {
      "BusinessShortCode": Number(process.env.BUSINESS_SHORTCODE),
      "Password": password,
      "Timestamp": timestamp,
      "TransactionType": "CustomerPayBillOnline",
      "Amount": amount,
      "PartyA": phone,
      "PartyB": Number(process.env.BUSINESS_SHORTCODE),
      "PhoneNumber": phone,
      "CallBackURL": `https://1739-102-215-189-77.ngrok-free.app/api/v1/payments/stkPushCallback`,
      "AccountReference": "Shoply",
      "TransactionDesc": "Paid online",
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
    console.log("Callback received:", req.body.Body.stkCallback);
    res.status(200).send("OK");
    // const { orderId } = req.params;
    // const {
    //   MerchantRequestID,
    //   CheckoutRequestID,
    //   ResultCode,
    //   ResultDesc,
    //   CallbackMetdata,
    // } = req.body.Body.stkCallback;

    // // Get the meta data from the meta
    // const meta = Object.values(await CallbackMetdata.Item);
    // const PhoneNumber = meta
    //   .find((o) => o.name === "PhoneNumber")
    //   .Value.toString();
    // const Amount = meta.find((o) => o.Name === "Amount").Value.toString();
    // const MpesaReceiptNumber = meta
    //   .find((o) => o.Name === "MpesaReceiptNumber")
    //   .Value.toString();
    // const TransactionDate = meta
    //   .find((o) => o.Name === "TransactionDate")
    //   .Value.toString();

    // Do something with the data
    // console.log("-".repeat(20), " OUTPUT IN THE CALLBACK ", "-".repeat(20));
    // console.log(
    //   `
    //     orderId:${orderId},
    //     MerchantRequestID : ${MerchantRequestID},
    //     CheckoutRequestID: ${CheckoutRequestID},
    //     ResultCode: ${ResultCode},
    //     ResultDesc: ${ResultDesc},
    //     PhoneNumber : ${PhoneNumber},
    //     Amount: ${Amount},
    //     MpesaReceiptNumber: ${MpesaReceiptNumber},
    //     TransactionDate : ${TransactionDate}
    //     `
    // );

    // let message = req.body.Body.stkCallback;
    // console.log(message);

    // return res.status(201).json({
    //   status: "success",
    //   data: message,
    // });
  }
);

export const confirmPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);
