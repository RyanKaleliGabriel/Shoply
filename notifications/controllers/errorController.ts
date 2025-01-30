import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";

const handleDuplicateDb = (err: any) => {
  const field = err.detail.match(/\((.*?)\)/)?.[1];
  const message = `Duplicate field value ${field}. Please use another value`;
  return new AppError(message, 400);
};

const handleNullDb = (err: any) => {
  const field = err.detail.match(/\((.*?)\)/)?.[1];
  const message = `Empty field value ${field}. `;
  return new AppError(message, 400);
};

const sendErrorDev = (err: any, req: Request, res: Response) => {
  console.error("Error 💥", err);
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: any, req: Request, res: Response) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  console.error("Error 💥", err);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong.",
  });
};

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "fail";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error;
    if (err.code === "23505") error = handleDuplicateDb(err);
    if (err.code === "23502") error = handleDuplicateDb(err);
    sendErrorProd(error, req, res);
  }
};

export default globalErrorHandler;
