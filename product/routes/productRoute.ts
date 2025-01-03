import express from "express";
import {
  deleteProduct,
  getAllProducts,
  getProduct,
  updateProduct,
} from "../controllers/productController";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProduct);

router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router