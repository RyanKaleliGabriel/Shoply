import express from "express";
import {
  addItem,
  authenticated,
  clearCart,
  getItems,
  removeItem,
  updateItem,
} from "../controllers/cartController";
import { restrictTo } from "../middleware/cartMiddleware";

const router = express.Router();

router.use(authenticated);
router.get("/", getItems);

router.use(restrictTo("user"));

router.post("/", addItem);
router.patch("/:id", updateItem);
router.delete("/:id", removeItem);
router.delete("/:userId", clearCart);

export default router;
