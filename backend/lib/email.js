import { QueueEmailSender } from "./email.queue.js";
import { DirectEmailSender } from "./email.direct.js";
import { CompositeEmailService } from "./email.service.js";
import { startEmailQueueWorker } from "./email.worker.js";
import { startRetryWorker } from "./email.retry.js";

export const createEmailService = () => {
  const directSender = new DirectEmailSender();
  const queueSender = new QueueEmailSender({
    queueName: process.env.EMAIL_QUEUE_NAME || "email-send",
    timeoutMs: Number.parseInt(process.env.RABBITMQ_TIMEOUT_MS || "1500", 10),
  });
  const emailService = new CompositeEmailService({ queueSender, directSender });
  return { emailService, directSender };
};

export const startEmailWorkers = ({ directSender }) => {
  startEmailQueueWorker({
    directSender,
    queueName: process.env.EMAIL_QUEUE_NAME || "email-send",
  });
  startRetryWorker(directSender);
};
