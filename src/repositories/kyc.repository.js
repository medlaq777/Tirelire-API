import kyc from "../models/kyc.model.js";

class KycRepositroy {
  async create(kycData) {
    const k = new kyc(kycData);
    return k.save();
  }

  async findByUserId(userId) {
    return kyc.findOne({ user: userId }).exec();
  }

  async updateStatus(id, status, verification = {}) {
    return kyc
      .findByIdAndUpdate(id, { status, verification }, { new: true })
      .exec();
  }

  async findById(id) {
    return kyc.findById(id).exec();
  }
}

export default new KycRepositroy();
