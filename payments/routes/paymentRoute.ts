import express from "express";
import { accessToken } from "../middlewares/accessToken";
import {
  authenticated,
  confirmPayment,
  intiateSTKPush,
  stkPushCallback,
} from "../controllers/paymentController";

const router = express.Router();

router.use(authenticated);
router.use(accessToken);

router.post("/stkPush", accessToken, intiateSTKPush);
router.post("/stkPushCallback/:orderId", stkPushCallback);
router.post("/confirmPayment/:checkoutRequestId", confirmPayment);

export default router;
