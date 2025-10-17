import Cron from "node-cron";
import NotificationService from "../services/notification.service.js";

Cron.schedule("09***", async () => {
  console.log("🔔 Vérification des paiements à rappeler...");
  await NotificationService.sendPaymentReminders();
});
