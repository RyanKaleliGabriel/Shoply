import express, { Response, Request, NextFunction } from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Routes
import userRoute from "./routes/userRoute";
import AppError from "./utils/appError";
import globalErrorHandler from "./controllers/errorController";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1/users", userRoute);

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  return next(
    new AppError(`Can't find ${req.originalUrl} on this server`, 404)
  );
});

app.use(globalErrorHandler);

export default app;
