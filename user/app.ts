import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";

// Routes
import userRoute from "./routes/userRoute";

dotenv.config();
const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1/users", userRoute);

export default app;
