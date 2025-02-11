import express from "express";
import { metricsRegistry } from "../middleware/prometheusMiddleware";
import { authenticated, restrictTo } from "../middleware/notificationsMiddleware";



const router = express.Router();

// router.use(authenticated);
// router.use(restrictTo("admin"));
router.get("/", metricsRegistry);

export default router