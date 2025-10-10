import Kyc from "../models/kyc.model";

class KycRepositroy {
  async create(kycData) {
    const k = new Kyc(kycData);
    return k.save;
  }

  async findByUserId(userId) {
    return Kyc.findOne({ user: userId }).exec();
  }

  async updateStatus(id, status, verification = {}) {
    return Kyc.findByIdAndUpdate(
      id,
      { status, verification },
      { new: true }
    ).exec();
  }

  async findById(id) {
    return Kyc.findById(id).exec();
  }
}
