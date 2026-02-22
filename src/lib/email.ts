import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, text, html, replyTo }: SendEmailOptions) {
  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    text: text ?? '',
    html: html ?? text ?? '',
    replyTo,
  });
}

export async function sendOtpEmail(to: string, otp: string, purpose = 'verification') {
  const subject =
    purpose === 'reset'
      ? 'Reset your ZeeBuddy password'
      : 'Your ZeeBuddy verification code';
  const html = `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #dc2626;">ZeeBuddy</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #dc2626;">${otp}</p>
      <p style="color: #6b7280; font-size: 12px;">This code expires in 10 minutes. Do not share it.</p>
    </div>
  `;
  return sendEmail({ to, subject, html, text: `Your code is: ${otp}` });
}
