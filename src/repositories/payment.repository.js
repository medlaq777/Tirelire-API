import Payment from "../models/payment.model.js";

class PaymentRepository {
  async create(data) {
    return new Payment(data).save();
  }

  async updateStatus(id, status) {
    console.log(id, status);
    return Payment.findByIdAndUpdate(id, { status }, { new: true });
  }

  async findByStripId(stripeId) {
    return Payment.findOne({ stripePaymentId: stripeId }).exec();
  }
}

export default new PaymentRepository();
