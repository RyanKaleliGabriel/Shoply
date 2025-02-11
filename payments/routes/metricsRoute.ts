import express from "express";

import { authenticated, restrictTo } from "../middlewares/paymentMiddleware";
import { metricsRegistry } from "../middlewares/prometheusMiddleware";

const router = express.Router();

// router.use(authenticated);
// router.use(restrictTo("admin"));
router.get("/", metricsRegistry);

export default router