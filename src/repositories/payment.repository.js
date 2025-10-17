import Payment from "../models/payment.model.js";

class PaymentRepository {
  async create(data) {
    return new Payment(data).save();
  }

  async updateStatus(id, status) {
    return Payment.findByIdAndUpdate(id, { status }, { new: true });
  }

  async findByStripId(stripeId) {
    return Payment.findOne({ stripePaymentId: stripeId }).exec();
  }

  async findByStripeId(stripeId) {
    return Payment.findOne({ stripePaymentId: stripeId }).exec();
  }

  async findByGroup(groupId) {
    return Payment.find({ group: groupId }).exec();
  }
}

export default new PaymentRepository();
