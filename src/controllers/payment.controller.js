import PaymentService from "../services/payment.service.js";
import Config from "../config/config.js";
import Stripe from "stripe";

class PaymentController {
  async createIntent(req, res, next) {
    try {
      const { groupId, amount } = req.user.id;
      const userId = req.user.id;
      const result = await PaymentService.createPaymentIntent({
        groupId,
        userId,
        amount,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async webhook(req, res, next) {
    try {
      const stripe = new Stripe(Config.stripeSecret);
      const sig = req.headers["stripe-signature"];
      const event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        Config.stripeWebhookSecret
      );
      await PaymentService.handleWebhook(event);
      res.json({ received: true });
    } catch (err) {
      console.error("webhook error:", err.message);
      res.status(400).send(`webhook Error: ${err.message}`);
    }
  }
}

export default new PaymentController();
