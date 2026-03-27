import amqp from 'amqplib';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer'
import { generateOtpEmailBody } from './otpEmailTamplate.js';


dotenv.config();



let channel

export const sendOtpToConsumers = async () => {
  try {
    const conn = await amqp.connect({
      protocol: 'amqp',
      hostname: process.env.RABBITMQ_HOST,
      port: 5672,
      username: process.env.RABBITMQ_USERNAME,
      password: process.env.RABBITMQ_PASSWORD,
    });

     channel = await conn.createChannel();
    const queueName = 'send-otp';

    await channel.assertQueue(queueName, { durable: true });
    console.log('Rabbit-MQ mail services is started listening consumers 🐰🐰');

    channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const { to, subject, body } = JSON.parse(msg.content.toString());
          const otp = body; 

          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD, 
            },
          });

          await transporter.sendMail({
            from: '"(संन्या) Social Media Application" <no-reply@sannya.com>',
            to,
            subject,
            text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
            html: generateOtpEmailBody({ otp }), 
          });

          

          console.log(`OTP mail is sent to ${to}`);
          channel.ack(msg);
        } catch (error) {
          console.error('Failed to process message:', error.message);
        }
      }
    }, { noAck: false }); 
  } catch (error) {
    console.error('Failed to start RabbitMQ consumer:', error.message);
  }
};


export const publishToQueue = async(queueName , message) => {
    if(!channel){
       console.log("Channel is not inisilized in Rabbit-MQ");
       return
    };

    channel.sendToQueue(queueName,Buffer.from(JSON.stringify(message)),{
        persistent:true
    })
}