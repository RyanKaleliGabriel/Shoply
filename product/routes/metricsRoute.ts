import express from "express";
import { authenticated, restrictTo } from "../middleware/productMiddleware";
import { metricsRegistry } from "../middleware/prometheusMiddleware";

const router = express.Router();

// router.use(authenticated);
// router.use(restrictTo("admin"));
router.get("/", metricsRegistry);

export default router