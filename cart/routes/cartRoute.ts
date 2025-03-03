import express from "express";
import {
  addItem,
  clearCart,
  getItems,
  healthCheck,
  removeItem,
  updateItem,
} from "../controllers/cartController";
import { authenticated, restrictTo } from "../middleware/cartMiddleware";
import { trackResponseSize } from "../middleware/prometheusMiddleware";

const router = express.Router();

router.use(trackResponseSize);
router.get("/health", healthCheck);
router.use(authenticated);
router.get("/", getItems);

router.use(restrictTo("user"));

router.post("/", addItem);
router.patch("/:id", updateItem);
router.delete("/:id", removeItem);
router.delete("/:userId", clearCart);

export default router;
