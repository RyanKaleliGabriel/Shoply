import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import dotenv from "dotenv";
import AppError from "../utils/appError";
import axios from "axios";

dotenv.config();
export const accessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const url =
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    const auth = Buffer.from(
      `${process.env.SAFARICOM_CONSUMER_KEY}:${process.env.SAFARICOM_CONSUMER_SECRET}`
    ).toString("base64");

    const response = await axios(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.data?.access_token) {
      return next(new AppError("Access token not found.", 404));
    }
    req.safaricomAccessToken = response.data.access_token;
    console.log(req.safaricomAccessToken)
  }
);
