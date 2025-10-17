import User from "../models/user.model.js";

class ReliabilityService {
  constructor() {
    this.maxScore = 100;
    this.minScore = 0;
  }

  async updateScore(userId, action) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    let newScore = user.reliabilityScore || 100;

    switch (action) {
      case "success":
        newScore = Math.min(this.maxScore, newScore + 1);
        break;
      case "fail":
        newScore = Math.max(this.minScore, newScore - 2);
        break;
      case "late":
        newScore = Math.max(this.minScore, newScore - 1);
        break;
      default:
        break;
    }

    user.reliabilityScore = newScore;
    await user.save();
    return newScore;
  }

  async getScore(userId) {
    const user = await User.findById(userId).select(
      "reliabilityScore name email"
    );
    if (!user) throw new Error("User not found");
    return user.reliabilityScore;
  }
}

export default new ReliabilityService();
