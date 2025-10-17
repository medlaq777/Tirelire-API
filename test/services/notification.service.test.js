import NotificationService from "../../src/services/notification.service.js";
import { Mailer } from "../../src/utils/mailer.js";
import Group from "../../src/models/group.model.js";
import Payment from "../../src/models/payment.model.js";
import User from "../../src/models/user.model.js";

jest.mock("../../src/utils/mailer.js");
jest.mock("../../src/models/group.model.js");
jest.mock("../../src/models/payment.model.js");
jest.mock("../../src/models/user.model.js");

describe("NotificationService", () => {
  let sendMailSpy;
  beforeEach(() => {
    jest.clearAllMocks();
    sendMailSpy = jest.spyOn(Mailer.prototype, "sendMail").mockResolvedValue();
  });

  describe("sendPaymentReminders", () => {
    it("should send reminders for pending payments within 2 days of deadline", async () => {
      const mockGroup = {
        _id: "g1",
        name: "Test Group",
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      };
      Group.find.mockResolvedValue([mockGroup]);

      Payment.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([
          {
            member: { email: "test@example.com", name: "Test User" },
            status: "pending",
          },
        ]),
      });
      await NotificationService.sendPaymentReminders();
      expect(sendMailSpy).toHaveBeenCalledWith(
        "test@example.com",
        expect.any(String),
        expect.stringContaining("Test User")
      );
    });

    it("should not send reminders if no pending payments", async () => {
      Group.find.mockResolvedValue([
        { _id: "g1", name: "Test Group", deadline: new Date() },
      ]);
      Payment.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([]),
      });
      await NotificationService.sendPaymentReminders();
      expect(sendMailSpy).not.toHaveBeenCalled();
    });
  });

  describe("sendRoundNotification", () => {
    it("should send round notification if user exists", async () => {
      User.findById.mockResolvedValue({ email: "user@example.com" });
      await NotificationService.sendRoundNotification("u1", "GroupName");
      expect(sendMailSpy).toHaveBeenCalledWith(
        "user@example.com",
        expect.any(String),
        expect.stringContaining("GroupName")
      );
    });

    it("should not send notification if user does not exist", async () => {
      User.findById.mockResolvedValue(null);
      await NotificationService.sendRoundNotification("u1", "GroupName");
      expect(sendMailSpy).not.toHaveBeenCalled();
    });
  });
});
