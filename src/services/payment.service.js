import Stripe from "stripe";
import Config from "../config/config.js";
import PaymentRepository from "../repositories/payment.repository.js";
import GroupRepository from "../repositories/group.repository.js";

class PaymentService {
  constructor(paymentRepo, groupRepo) {
    this.stripe = new Stripe(Config.stripeSecret);
    this.paymentRepo = paymentRepo;
    this.groupRepo = groupRepo;
  }

  async createPaymentIntent({ groupId, userId, amount }) {
    const group = await this.groupRepo.findById(groupId);
    if (!group) {
      const e = new Error("Group not found");
      e.status = 404;
      throw e;
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      metadata: { groupId, userId },
    });

    const payment = await this.paymentRepo.create({
      group: groupId,
      member: userId,
      amount,
      stripePaymentId: paymentIntent.id,
    });
    return { clientSecret: paymentIntent.client_secret, payment };
  }

  async handleWebhook(event) {
    const { type, data } = event;

    if (type === "payment_intent.succeeded") {
      const paymentIntent = data.object;
      const userId = paymentIntent.metadata && paymentIntent.metadata.userId;
      await ReliabilityService.updateScore(userId, "success");

      const payment = await this.paymentRepo.findByStripId(
        paymentIntent.payment_intent
      );
      if (payment)
        await this.paymentRepo.updateStatus(payment._id, "succeeded");
    }

    if (type === "payment_intent.payment_failed") {
      const paymentIntent = data.object;
      const userId = paymentIntent.metadata && paymentIntent.metadata.userId;
      await ReliabilityService.updateScore(userId, "fail");

      const payment = await this.paymentRepo.findByStripeId(paymentIntent.id);
      if (payment) await this.paymentRepo.updateStatus(payment._id, "failed");
    }
  }
}
export { PaymentService };

export default new PaymentService(PaymentRepository, GroupRepository);
