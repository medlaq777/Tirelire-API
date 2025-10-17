process.env.MAIL_USER = "testuser@example.com";
process.env.MAIL_PASS = "testpass";
jest.mock("nodemailer");

describe("Mailer", () => {
  let sendMailMock;
  let MailerClass;
  let mailerInstance;
  let NodeMailer;
  beforeEach(() => {
    jest.resetModules();
    NodeMailer = require("nodemailer");
    sendMailMock = jest.fn().mockResolvedValue();
    NodeMailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
    MailerClass = require("../../src/utils/mailer.js").Mailer;
    mailerInstance = new MailerClass();
  });

  it("should send mail successfully", async () => {
    await mailerInstance.sendMail("to@example.com", "Subject", "Text");
    expect(sendMailMock).toHaveBeenCalledWith({
      from: expect.stringContaining("TIRELIRE APP"),
      to: "to@example.com",
      subject: "Subject",
      text: "Text",
    });
  });

  it("should handle errors when sending mail", async () => {
    sendMailMock.mockRejectedValue(new Error("fail"));
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    await mailerInstance.sendMail("to@example.com", "Subject", "Text");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Mail error :",
      expect.stringContaining("fail")
    );
    consoleSpy.mockRestore();
  });
});
