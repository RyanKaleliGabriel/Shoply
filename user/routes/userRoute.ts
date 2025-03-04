import express from "express";
import {
  deleteMe,
  getMe,
  googleRedirect,
  healthCheck,
  login,
  logout,
  signINGoogle,
  signup,
  updateMe,
  updatePassword,
} from "../controllers/userController";
import { protect } from "../middleware/userMiddleware";
import { trackResponseSize } from "../middleware/prometheusMiddleware";

const router = express.Router();

router.use(trackResponseSize);

router.get("/health", healthCheck);
router.post("/signup", signup);
router.post("/login", login);
router.get("/signInGoogle", signINGoogle);
router.get("/google/callback", googleRedirect);

router.use(protect);

router.get("/logout", logout);
router.patch("/updatePassword", updatePassword);
router.get("/getMe", getMe);
router.patch("/updateMe", updateMe);
router.delete("/deleteMe", deleteMe);

// router.get("/metrics", metricsRegistry);

export default router;
