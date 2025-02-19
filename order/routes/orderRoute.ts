import express from "express";
import {
  createOrder,
  deleteOrder,
  getOrder,
  getOrders,
  updateOrder,
} from "../controllers/orderController";
import { authenticated, restrictTo } from "../middleware/orderMiddleware";
import { trackResponseSize } from "../middleware/prometheusMiddleware";

const router = express.Router();
router.use(trackResponseSize)
router.use(authenticated);
router.get("/", getOrders);
router.get("/:id", getOrder);

router.use(restrictTo("user"));

router.post("/", createOrder);
router.patch("/:id", updateOrder);
router.delete("/:id", deleteOrder);

export default router;
