import Contribution from "../models/contribution.model.js";

class ContributionRepository {
  async create(data) {
    return new Contribution(data).save();
  }
  async findByGroup(groupId) {
    return Contribution.find({ group: groupId, status: "active" })
      .populate("beneficiary")
      .exec();
  }

  async findActiveByGroup(groupId) {
    return Contribution.findOne({ group: groupId, status: "active" })
      .populate("beneficiary")
      .exec();
  }
  async updateStatus(id, status) {
    return Contribution.findByIdAndUpdate(id, { status }, { new: true });
  }
  async markCompleted(id) {
    return Contribution.findByIdAndUpdate(
      id,
      {
        status: "completed",
        endDate: new Date(),
      },
      { new: true }
    );
  }
}

export default new ContributionRepository();
