import userModel from "../models/user.model.js";

class UserRepository {
  async create(userData) {
    const user = new userModel(userData);
    return user.save();
  }
  async findByEmail(email) {
    return userModel.findOne({ email }).exec();
  }

  async findById(id) {
    return userModel.findById(id).exec();
  }

  async emailExists(email) {
    const count = await userModel.countDocuments({ email }).exec();
    return count > 0;
  }

  async setKycVerified(userId, isVerified = true) {
    return userModel
      .findByIdAndUpdate(userId, { isKycVerified: !!isVerified }, { new: true })
      .exec();
  }
}

export default new UserRepository();
