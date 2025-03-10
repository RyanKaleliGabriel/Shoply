import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { logger } from "./logger";

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
    logger.info(`Successfully authenticated ${req.user.username}`);
    next();
  }
);

export const restrictTo = (role: string) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const response = await fetch(`${USER_URL}/api/v1/users/getMe`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${req.token}`,
      },
    });

    if (!response.ok) {
      return next(new AppError("Failed to authorize user. Try again.", 403));
    }

    const user = await response.json();

    if (user.data.role !== role) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  });
