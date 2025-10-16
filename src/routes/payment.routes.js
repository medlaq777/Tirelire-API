import express from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import KycMiddleware from "../middlewares/kyc.middleware.js";
import PaymentController from "../controllers/payment.controller.js";

class PaymentRoutes {
  static build() {
    const router = express.Router();

    router.post(
      "/create",
      AuthMiddleware.protect,
      KycMiddleware.requireKyc,
      PaymentController.createIntent.bind(PaymentController)
    );

    router.post(
      "/webhook",
      express.raw({ type: "application/json" }),
      PaymentController.webhook.bind(PaymentController)
    );
  }
}

export default PaymentRoutes;
