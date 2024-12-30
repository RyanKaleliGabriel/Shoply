import express from "express";
import {
  deleteMe,
  getMe,
  login,
  logout,
  protect,
  signup,
  updateMe,
  updatePassword,
} from "../controllers/userController";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);

router.use(protect);

router.patch("/updatePassword", updatePassword);
router.get("/getMe", getMe);
router.patch("/updateMe", updateMe);
router.delete("/deleteMe", deleteMe);

export default router;
