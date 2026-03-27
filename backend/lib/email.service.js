import crypto from "crypto";
import { buildResetPasswordEmail, buildVerifyEmail } from "./email.templates.js";
import { enqueueRetry } from "./email.retry.js";
import { logInfo, logWarn } from "./logger.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class CompositeEmailService {
  constructor({ queueSender, directSender }) {
    this.queueSender = queueSender;
    this.directSender = directSender;
  }

  async sendVerificationEmail({ user, token }) {
    const { subject, html, text } = buildVerifyEmail({
      name: user.name,
      token,
    });
    const message = {
      messageId: crypto.randomUUID(),
      to: user.email,
      subject,
      html,
      text,
      type: "verify",
      userId: user._id?.toString(),
    };
    return this.sendWithFallback(message);
  }

  async sendPasswordResetEmail({ user, token }) {
    const { subject, html, text } = buildResetPasswordEmail({
      name: user.name,
      token,
    });
    const message = {
      messageId: crypto.randomUUID(),
      to: user.email,
      subject,
      html,
      text,
      type: "reset",
      userId: user._id?.toString(),
    };
    return this.sendWithFallback(message);
  }

  async sendWithFallback(message) {
    if (!this.directSender?.isConfigured?.()) {
      const error = new Error("Email delivery is not configured");
      logWarn("email.delivery.unavailable", {
        messageId: message.messageId,
        error: error.message,
      });
      throw error;
    }

    if (this.queueSender) {
      try {
        const queued = await this.queueSender.send(message);
        logInfo("email.sent", { messageId: message.messageId, provider: "queue" });
        return queued;
      } catch (error) {
        logWarn("email.queue_unavailable", {
          messageId: message.messageId,
          error: error.message,
        });
      }
    }

    return this.sendDirectWithRetry(message);
  }

  async sendDirectWithRetry(message) {
    const retrySchedule = [0, 250, 750];

    for (let attempt = 0; attempt < retrySchedule.length; attempt += 1) {
      if (retrySchedule[attempt] > 0) {
        await delay(retrySchedule[attempt]);
      }
      try {
        const result = await this.directSender.send(message);
        logInfo("email.sent", { messageId: message.messageId, provider: "direct" });
        return result;
      } catch (error) {
        logWarn("email.direct_failed", {
          messageId: message.messageId,
          attempt: attempt + 1,
          error: error.message,
        });
      }
    }

    enqueueRetry(message, 1);
    return { provider: "direct", status: "queued_for_retry" };
  }
}
