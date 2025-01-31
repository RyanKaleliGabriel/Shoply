import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import path from "path"

import globalErrorHandler from "./controllers/errorController";
import notificationsRoute from "./routes/notificationsRoute";
import AppError from "./utils/appError";

dotenv.config();
const app = express();

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

app.use(express.json());

const corsOptions = {
  origin: "http://127.0.0.1",
  credentials: true,
};
app.use(cors(corsOptions));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1/notifications", notificationsRoute);
app.use("*", (req: Request, res: Response, next: NextFunction) => {
  return next(
    new AppError(`${req.originalUrl} does not exist on this server`, 404)
  );
});

app.use(globalErrorHandler);

export default app;
