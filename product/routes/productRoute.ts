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
  healthCheck,

} from "../controllers/productController";
import { authenticated, restrictTo } from "../middleware/productMiddleware";
import { trackResponseSize } from "../middleware/prometheusMiddleware";

const router = express.Router();

router.use(trackResponseSize)

router.get("/", getProducts);
router.get("/health", healthCheck)
router.get("/:id", getProduct);
router.get("/categories/all", getCategories);
router.get("/categories/:id", getCategory);

router.use(authenticated);
router.use(restrictTo("admin"));

router.post("/", createProduct);
router.post("/categories/create", createCategory);

router.patch("/:id", updateProduct);
router.patch("/categories/:id", updateCategory);

router.delete("/:id", deleteProduct);
router.delete("/categories/:id", deleteCategory);

export default router;
