import Mailer from "../../src/utils/mailer.js";
import NodeMailer from "nodemailer";

jest.mock("nodemailer");

describe("Mailer", () => {
  let sendMailMock;
  beforeEach(() => {
    sendMailMock = jest.fn().mockResolvedValue();
    NodeMailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
  });

  it("should send mail successfully", async () => {
    await Mailer.sendMail("to@example.com", "Subject", "Text");
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
    await Mailer.sendMail("to@example.com", "Subject", "Text");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Mail error :",
      expect.stringContaining("fail")
    );
    consoleSpy.mockRestore();
  });
});
