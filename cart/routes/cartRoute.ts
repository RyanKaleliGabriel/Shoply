import express from "express";
import {
  addItem,
  getItem,
  getItems,
  removeItem,
} from "../controllers/cartController";

const router = express.Router();

router.get("/", getItems);
router.get("/:id", getItem);

router.post("/", addItem);
router.delete("/:id", removeItem);

export default router;
