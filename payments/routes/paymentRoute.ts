import express from "express";
import { accessToken } from "../middlewares/accessToken";
import {
  authenticated,
  checkoutStripe,
  confirmPayment,
  getTransaction,
  getTransactions,
  intiateSTKPush,
  stkPushCallback,
  stripeCancel,
  stripeSuccess,
} from "../controllers/paymentController";

const router = express.Router();

router.use(authenticated);

router.get("/transactions", getTransactions);
router.get("/transactions/:id", getTransaction);

router.post("/stripe/checkout/:orderId", checkoutStripe);
router.get("/stripe/success/:orderId", stripeSuccess);
router.get("/stripe/cancel", stripeCancel);

router.use(accessToken);

router.post("/stkPush", accessToken, intiateSTKPush);
router.post("/stkPushCallback", stkPushCallback);
router.post("/confirmPayment/:checkoutRequestId", confirmPayment);


export default router;
