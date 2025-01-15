import express from "express";
import {
  createOrder,
  deleteOrder,
  getOrder,
  getOrders,
} from "../controllers/orderController";

const router = express.Router();

router.get("/", getOrders);
router.get("/:id", getOrder);
router.post("/", createOrder);
router.delete("/:id", deleteOrder);

export default router;
