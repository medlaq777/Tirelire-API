import NodeMailer from "nodemailer";

class Mailer {
  constructor() {
    this.transporter = NodeMailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendMail(to, subject, text) {
    try {
      await this.transporter.sendMail({
        from: `"TIRELIRE APP" <${process.env.MAIL_USER}>`,
        to,
        subject,
        text,
      });
    } catch (err) {
      console.error("Mail error :", err.message);
    }
  }
}

export { Mailer };
