import express from "express";
import { accessToken } from "../middlewares/accessToken";
import {
  checkoutStripe,
  confirmPayment,
  getTransaction,
  getTransactions,
  healthCheck,
  intiateSTKPush,
  stkPushCallback,
  stripeCancel,
  stripeSuccess,
} from "../controllers/paymentController";
import { authenticated, restrictTo } from "../middlewares/paymentMiddleware";
import { trackResponseSize } from "../middlewares/prometheusMiddleware";

const router = express.Router();
router.use(trackResponseSize)

router.get("/health", healthCheck)
router.use(authenticated);

router.get("/transactions", getTransactions);
router.get("/transactions/:id", getTransaction);

router.use(restrictTo("user"));

router.post("/stripe/checkout/:orderId", checkoutStripe);
router.get("/stripe/success/:orderId", stripeSuccess);
router.get("/stripe/cancel", stripeCancel);

router.use(accessToken);

router.post("/stkPush", accessToken, intiateSTKPush);
router.post("/stkPushCallback", stkPushCallback);
router.post("/confirmPayment/:checkoutRequestId", confirmPayment);

export default router;
