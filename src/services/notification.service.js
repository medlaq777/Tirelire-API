import Mailer from "../utils/mailer.js";
import Payment from "../models/payment.model.js";
import Group from "../models/group.model.js";
import User from "../models/user.model.js";

class NotificationService {
  async sendPaymentReminders() {
    const today = new Date();
    const groups = await Group.find();

    for (const group of groups) {
      const pendingPayments = await Payment.find({
        group: group._id,
        status: "pending",
      }).populate("member");
      for (const payment of pendingPayments) {
        const deadline = new Date(groupRepository.deadline);
        const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 2 && diffDays >= 0) {
          await Mailer.sendMail(
            payment.member.email,
            "Rappel de paiement",
            `Bonjour ${payment.member.name}, votre paiement pour le groupe"${group.name}" est dû dans ${diffDays} jour(s).`
          );
        }
      }
    }
  }

  async sendRoundNotification(userId, groupName) {
    const user = await User.findById(userId);
    if (!user) return;
    await Mailer.sendMail(
      user.email,
      "Félicitations 🎉",
      `Vous êtes le bénéficiaire du prochain tour de contribution pour le groupe "${groupName}".`
    );
  }
}

export default new NotificationService();
