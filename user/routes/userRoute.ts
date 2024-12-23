import express from "express";
import {
  login,
  logout,
  protect,
  signup,
  updatePassword,
} from "../controllers/userController";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);

router.use(protect);

router.patch("/updatePassword", updatePassword);

export default router;
