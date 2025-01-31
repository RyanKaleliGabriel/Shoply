import express from "express";
import {
  authenticated,
  createMessage,
  sendReceipt,
} from "../controllers/notificationsController";

const router = express.Router();

router.use(authenticated);
router.post("/twilio/sendsms", createMessage);
router.get("/email/sendReceipt/:orderId", sendReceipt)

export default router;
