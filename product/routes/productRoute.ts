import express from "express";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getAllCategories,
  getAllProducts,
  getCategory,
  getProduct,
  updateCategory,
  updateProduct,
} from "../controllers/productController";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProduct);
router.get("/categories/all", getAllCategories);
router.get("/categories/:id", getCategory);

router.post("/createProduct", createProduct);
router.post("/categories/createCategory", createCategory);

router.patch("/:id", updateProduct);
router.patch("/categories/:id", updateCategory);

router.delete("/:id", deleteProduct);
router.delete("/categories/:id", deleteCategory);
export default router;
