import express from "express";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategories,
  getProducts,
  getCategory,
  getProduct,
  updateCategory,
  updateProduct,
} from "../controllers/productController";

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProduct);
router.get("/categories/all", getCategories);
router.get("/categories/:id", getCategory);

router.post("/", createProduct);
router.post("/categories/create", createCategory);

router.patch("/:id", updateProduct);
router.patch("/categories/:id", updateCategory);

router.delete("/:id", deleteProduct);
router.delete("/categories/:id", deleteCategory);

export default router;
