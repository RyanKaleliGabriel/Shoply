import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../db/con";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";

// Generate a signed JWT token with the user's id
const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const createSendToken = (
  user: any,
  statusCode: number,
  res: Response,
  req: Request
) => {
  const token = signToken(user.id);
  user.password = undefined;

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.header("X-forwaded-proto") === "https",
  });

  res.status(statusCode).json({
    status: "success",
    token,
    data: user,
  });
};

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;

    // Get the jwt token in the headers or cookies.
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    // return an error if there is no token
    if (!token || token === "loggedOut") {
      return next(
        new AppError("You are not logged in! Please login to get access!", 401)
      );
    }

    // Verify the token
    const verifyToken = (token: string, secret: string) =>
      new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err: any, decoded: any) => {
          if (err) return reject(err);
          resolve(decoded);
        });
      });

    const decoded: any = await verifyToken(token, process.env.JWT_SECRET!);

    // Check if the user still exists
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [
      decoded.id,
    ]);

    if (user.rows.length === 0) {
      return next(
        new AppError("The user belonging to this token no longer exists", 401)
      );
    }
    // Check if user changed password after token was issued

    //Initialise req.user as the user (Protect the user)
    req.user = user.rows[0];
    next();
  }
);

export const restrictTo = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (role !== req.user.role) {
      return next(new AppError("Request restricted to authorized users", 403));
    }
    next();
  };
};
