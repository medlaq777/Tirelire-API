import NotificationService from "../../src/services/notification.service.js";
import Mailer from "../../src/utils/mailer.js";
import Group from "../../src/models/group.model.js";
import Payment from "../../src/models/payment.model.js";
import User from "../../src/models/user.model.js";

jest.mock("../../src/utils/mailer.js");
jest.mock("../../src/models/group.model.js");
jest.mock("../../src/models/payment.model.js");
jest.mock("../../src/models/user.model.js");

describe("NotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendPaymentReminders", () => {
    it("should send reminders for pending payments within 2 days of deadline", async () => {
      const mockGroup = {
        _id: "g1",
        name: "Test Group",
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      };
      Group.find.mockResolvedValue([mockGroup]);
      Payment.find.mockResolvedValue([
        {
          member: { email: "test@example.com", name: "Test User" },
          status: "pending",
        },
      ]);
      Mailer.sendMail.mockResolvedValue();
      await NotificationService.sendPaymentReminders();
      expect(Mailer.sendMail).toHaveBeenCalledWith(
        "test@example.com",
        expect.any(String),
        expect.stringContaining("Test User")
      );
    });

    it("should not send reminders if no pending payments", async () => {
      Group.find.mockResolvedValue([
        { _id: "g1", name: "Test Group", deadline: new Date() },
      ]);
      Payment.find.mockResolvedValue([]);
      await NotificationService.sendPaymentReminders();
      expect(Mailer.sendMail).not.toHaveBeenCalled();
    });
  });

  describe("sendRoundNotification", () => {
    it("should send round notification if user exists", async () => {
      User.findById.mockResolvedValue({ email: "user@example.com" });
      Mailer.sendMail.mockResolvedValue();
      await NotificationService.sendRoundNotification("u1", "GroupName");
      expect(Mailer.sendMail).toHaveBeenCalledWith(
        "user@example.com",
        expect.any(String),
        expect.stringContaining("GroupName")
      );
    });

    it("should not send notification if user does not exist", async () => {
      User.findById.mockResolvedValue(null);
      await NotificationService.sendRoundNotification("u1", "GroupName");
      expect(Mailer.sendMail).not.toHaveBeenCalled();
    });
  });
});
