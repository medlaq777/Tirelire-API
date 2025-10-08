const userModel = require("../models/user.model");

class UserRepository {
  async createUser(userData) {
    const user = new userModel(userData);
    return user.save();
  }
  async findUserByEmail(email) {
    return userModel.findOne({ email }).exec();
  }

  async findUserById(id) {
    return userModel.findById(id).exec();
  }

  async emailExists(email) {
    const count = await userModel.countDocuments({ email }).exec();
    return count > 0;
  }
}

module.exports = new UserRepository();
