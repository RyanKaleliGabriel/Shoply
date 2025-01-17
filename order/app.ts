import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";

import globalErrorHandler from "./controllers/errorController";
import orderRoute from "./routes/orderRoute";
import AppError from "./utils/appError";

dotenv.config();
const app = express();

app.use(express.json());

const corsOptions = {
  origin: "http://127.0.0.1",
  credentials: true,
};
app.use(cors(corsOptions));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1/orders", orderRoute);

app.use("*", (req: Request, res: Response, next: NextFunction) => {
  return next(
    new AppError(`${req.originalUrl} does not exists on this server`, 404)
  );
});

app.use(globalErrorHandler);

export default app;
