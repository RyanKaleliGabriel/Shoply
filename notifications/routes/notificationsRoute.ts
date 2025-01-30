import express from "express";
import {
  authenticated,
  createMessage,
} from "../controllers/notificationsController";

const router = express.Router();

router.use(authenticated);
router.post("/twilio/sendsms", createMessage);

export default router;
