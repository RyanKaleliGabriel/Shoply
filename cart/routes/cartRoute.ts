import express from "express";
import {
  addItem,
  authenticated,
  getItems,
  removeItem,
  updateItem,
} from "../controllers/cartController";

const router = express.Router();

router.use(authenticated);
router.get("/", getItems);
router.post("/", addItem);
router.patch("/:id", updateItem);
router.delete("/:id", removeItem);

export default router;
