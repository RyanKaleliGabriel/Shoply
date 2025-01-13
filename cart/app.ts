import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import dotenv from "dotenv";

import cartRoute from "./routes/cartRoute";
import AppError from "./utils/appError";
import globalErrorHandler from "./controllers/errorController";

dotenv.config();
const app = express();

app.use(express.json());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1/cart", cartRoute);

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  return next(
    new AppError(`Could not find ${req.originalUrl} in this server`, 401)
  );
});

app.use(globalErrorHandler);

export default app;
