import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import orderRoute from "./routes/orderRoute";

const app = express();
dotenv.config();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1/orders", orderRoute);

export default app;
