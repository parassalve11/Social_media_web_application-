import amqp from "amqplib";
import { logInfo, logWarn } from "./logger.js";

const buildRabbitUrl = () => {
  if (process.env.RABBITMQ_URL) return process.env.RABBITMQ_URL;
  const host = process.env.RABBITMQ_HOST || "localhost";
  const port = process.env.RABBITMQ_PORT || "5672";
  const user = process.env.RABBITMQ_USERNAME || "guest";
  const pass = process.env.RABBITMQ_PASSWORD || "guest";
  return `amqp://${user}:${pass}@${host}:${port}`;
};

export const startEmailQueueWorker = async ({
  directSender,
  queueName = "email-send",
}) => {
  try {
    const connection = await amqp.connect(buildRabbitUrl());
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });
    logInfo("email.worker.started", { queueName });

    channel.consume(
      queueName,
      async (msg) => {
        if (!msg) return;
        try {
          const payload = JSON.parse(msg.content.toString());
          await directSender.send(payload);
          channel.ack(msg);
        } catch (error) {
          logWarn("email.worker.failed", { error: error.message });
          channel.nack(msg, false, true);
        }
      },
      { noAck: false }
    );
  } catch (error) {
    logWarn("email.worker.unavailable", { error: error.message });
  }
};
