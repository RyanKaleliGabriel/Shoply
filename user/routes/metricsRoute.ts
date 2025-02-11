import express from "express";
import { metricsRegistry } from "../middleware/prometheusMiddleware";
import { protect, restrictTo } from "../middleware/userMiddleware";

const router = express.Router();

// router.use(protect);
// router.use(restrictTo("admin"));
router.get("/", metricsRegistry);

export default router