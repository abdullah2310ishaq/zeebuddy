import nodemailer from 'nodemailer';

// TEMPORARY: fallback when .env is not set. Move to .env.local and remove these before commit/production.
// Use the Gmail account that owns the App Password (abdullahishaq210909@gmail.com).
const FALLBACK_SMTP_USER = 'abdullahishaq210909@gmail.com';
const FALLBACK_SMTP_PASS = 'sckfdkvsyafqpolm'; // App password (ZeeBuddy), no spaces

// Build transporter with current env each time (avoids stale env; strips spaces from Gmail App Password).
// In development, prefer in-code fallback so .env does not override the working App Password.
function getTransporter() {
  const isDev = process.env.NODE_ENV === 'development';
  const user = isDev ? FALLBACK_SMTP_USER : (process.env.SMTP_USER || FALLBACK_SMTP_USER);
  const rawPass = isDev ? FALLBACK_SMTP_PASS : (process.env.SMTP_PASS || FALLBACK_SMTP_PASS);
  const pass = typeof rawPass === 'string' ? rawPass.replace(/\s/g, '') : rawPass;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: true },
  });
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, text, html, replyTo }: SendEmailOptions) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || FALLBACK_SMTP_USER;
  return transporter.sendMail({
    from,
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
