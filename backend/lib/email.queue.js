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

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("RabbitMQ timeout")), timeoutMs)
    ),
  ]);

export class QueueEmailSender {
  constructor({ queueName = "email-send", timeoutMs = 1500 } = {}) {
    this.queueName = queueName;
    this.timeoutMs = timeoutMs;
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    if (this.channel) return;
    const connection = await withTimeout(amqp.connect(buildRabbitUrl()), this.timeoutMs);
    const channel = await connection.createChannel();
    await channel.assertQueue(this.queueName, { durable: true });
    this.connection = connection;
    this.channel = channel;
    logInfo("email.queue.connected", { queue: this.queueName });
  }

  async send(message) {
    try {
      await this.connect();
      const ok = this.channel.sendToQueue(
        this.queueName,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
      if (!ok) {
        throw new Error("Queue backpressure");
      }
      return { provider: "queue", status: "queued" };
    } catch (error) {
      logWarn("email.queue.failed", { error: error.message });
      throw error;
    }
  }
}
