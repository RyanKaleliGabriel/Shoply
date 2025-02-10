import express from "express";
import {
  deleteMe,
  getMe,
  googleRedirect,
  login,
  logout,
  signINGoogle,
  signup,
  updateMe,
  updatePassword,
} from "../controllers/userController";
import { protect } from "../middleware/userMiddleware";
import { metricsRegistry } from "../middleware/prometheusMiddleware";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.get("/signInGoogle", signINGoogle);
router.get("/google/callback", googleRedirect);

router.use(protect);

router.patch("/updatePassword", updatePassword);
router.get("/getMe", getMe);
router.patch("/updateMe", updateMe);
router.delete("/deleteMe", deleteMe);

router.get("/metrics", metricsRegistry);

export default router;
