import express from "express";
import {

  createMessage,
  sendReceipt,
} from "../controllers/notificationsController";
import { authenticated } from "../middleware/notificationsMiddleware";
import { trackResponseSize } from "../middleware/prometheusMiddleware";

const router = express.Router();
router.use(trackResponseSize)
router.use(authenticated);
router.post("/twilio/sendsms", createMessage);
router.get("/email/sendReceipt/:orderId", sendReceipt)

export default router;
