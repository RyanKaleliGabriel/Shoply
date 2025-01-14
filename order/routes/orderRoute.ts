import express from "express";
import {
  createOrder,
  deleteOrder,
  getOrder,
  getOrders,
  updateOrder,
} from "../controllers/orderController";

const router = express.Router();

router.get("/", getOrders);
router.get("/:id", getOrder);

router.post("/", createOrder);
router.patch("/:id", updateOrder);

router.delete("/:id", deleteOrder);

export default router;
