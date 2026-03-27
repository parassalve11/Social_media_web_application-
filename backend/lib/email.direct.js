import nodemailer from "nodemailer";
import { logError, logInfo } from "./logger.js";

const buildTransporter = () => {
  const host = process.env.EMAIL_SMTP_HOST;
  const port = Number.parseInt(process.env.EMAIL_SMTP_PORT || "465", 10);
  const secure = process.env.EMAIL_SMTP_SECURE
    ? process.env.EMAIL_SMTP_SECURE === "true"
    : port === 465;

  if (!host) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS,
    },
  });
};

export class DirectEmailSender {
  constructor() {
    this.transporter = buildTransporter();
  }

  isConfigured() {
    return process.env.EMAIL_DRY_RUN === "true" || Boolean(this.transporter);
  }

  async send(message) {
    if (process.env.EMAIL_DRY_RUN === "true") {
      logInfo("email.direct.dry_run", { to: message.to, subject: message.subject });
      return { provider: "direct", status: "sent" };
    }

    if (!this.transporter) {
      const error = new Error("SMTP not configured");
      logError("email.direct.config_missing", { error: error.message });
      throw error;
    }

    const fromName = process.env.EMAIL_FROM_NAME || "Social Media App";
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || "no-reply@example.com";

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    logInfo("email.direct.sent", { to: message.to, subject: message.subject });
    return { provider: "direct", status: "sent" };
  }
}
