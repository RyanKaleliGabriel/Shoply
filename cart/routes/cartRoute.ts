import express from "express";
import {
  addItem,
  authenticated,
  getItem,
  getItems,
  removeItem,
} from "../controllers/cartController";

const router = express.Router();

router.use(authenticated);
router.get("/", getItems);
router.get("/:id", getItem);
router.post("/", addItem);
router.delete("/:id", removeItem);

export default router;
