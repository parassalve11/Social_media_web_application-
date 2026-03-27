import { logInfo, logWarn } from "./logger.js";

const retryQueue = [];
const MAX_ATTEMPTS = Number.parseInt(process.env.EMAIL_MAX_RETRIES || "5", 10);

const getBackoffMs = (attempt) =>
  Math.min(60000, 500 * Math.pow(2, Math.max(0, attempt - 1)));

export const enqueueRetry = (message, attempt = 1) => {
  if (attempt > MAX_ATTEMPTS) {
    logWarn("email.retry.exhausted", { messageId: message.messageId });
    return;
  }
  const nextAttemptAt = Date.now() + getBackoffMs(attempt);
  retryQueue.push({ message, attempt, nextAttemptAt });
  logInfo("email.retry.queued", {
    messageId: message.messageId,
    attempt,
    nextAttemptAt,
  });
};

export const startRetryWorker = (directSender) => {
  setInterval(async () => {
    const now = Date.now();
    const dueItems = retryQueue.filter((item) => item.nextAttemptAt <= now);
    if (!dueItems.length) return;

    retryQueue.splice(
      0,
      retryQueue.length,
      ...retryQueue.filter((item) => item.nextAttemptAt > now)
    );

    for (const item of dueItems) {
      try {
        await directSender.send(item.message);
        logInfo("email.retry.sent", { messageId: item.message.messageId });
      } catch (error) {
        logWarn("email.retry.failed", {
          messageId: item.message.messageId,
          error: error.message,
        });
        enqueueRetry(item.message, item.attempt + 1);
      }
    }
  }, 1500);
};
