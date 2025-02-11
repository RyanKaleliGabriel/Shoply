import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path"

import globalErrorHandler from "./controllers/errorController";
import orderRoute from "./routes/orderRoute";
import AppError from "./utils/appError";
import { trackResponseSize } from "./middleware/prometheusMiddleware";
import metricsRoute from "./routes/metricsRoute"

dotenv.config();
const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.disable("x-powered-by")

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(compression())

const corsOptions = {
  origin: "http://127.0.0.1",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(helmet({ contentSecurityPolicy: false }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limtiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 100,
  message: "Too many requests from this IP please try again in an hour",
});

app.use(limtiter);
app.use(trackResponseSize);
app.use("/metrics", metricsRoute)
app.use("/api/v1/orders", orderRoute);

app.use("*", (req: Request, res: Response, next: NextFunction) => {
  return next(
    new AppError(`${req.originalUrl} does not exists on this server`, 404)
  );
});

app.use(globalErrorHandler);

export default app;
