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

/** Brand colors matching the web app theme */
const BRAND = {
  primary: '#C21C15',
  secondary: '#4C50D5',
  gray: '#6B7280',
  grayLight: '#9CA3AF',
  white: '#FFFFFF',
} as const;

/**
 * Generates a beautiful, bilingual (EN/NL) OTP email HTML template
 * aligned with ZeeBuddy's red-to-purple gradient theme.
 */
function buildOtpEmailHtml(otp: string, purpose: 'verification' | 'reset'): string {
  const isReset = purpose === 'reset';

  const titleEn = isReset ? 'Reset your password' : 'Your verification code';
  const titleNl = isReset ? 'Reset je wachtwoord' : 'Je verificatiecode';

  const introEn = isReset
    ? 'Use the code below to reset your ZeeBuddy password.'
    : 'Use the code below to verify your ZeeBuddy account.';
  const introNl = isReset
    ? 'Gebruik de onderstaande code om je ZeeBuddy-wachtwoord te resetten.'
    : 'Gebruik de onderstaande code om je ZeeBuddy-account te verifiëren.';

  const expiryEn = 'This code expires in 10 minutes. Do not share it with anyone.';
  const expiryNl = 'Deze code verloopt over 10 minuten. Deel deze niet met anderen.';

  const footerEn = "If you didn't request this, you can safely ignore this email.";
  const footerNl = 'Als je dit niet hebt aangevraagd, kun je deze e-mail negeren.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>ZeeBuddy - ${titleEn}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F3F4F6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: ${BRAND.white}; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
          <!-- Header with gradient -->
          <tr>
            <td style="background-color: ${BRAND.primary}; background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.secondary} 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: ${BRAND.white}; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">ZeeBuddy</h1>
              <p style="margin: 8px 0 0 0; color: #000000; font-size: 14px;">${titleEn} · ${titleNl}</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">${introEn}</p>
              <p style="margin: 0 0 24px 0; color: ${BRAND.gray}; font-size: 14px; line-height: 1.6;">${introNl}</p>
              <!-- OTP box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 24px; background-color: #FEF2F2; background: linear-gradient(135deg, rgba(194, 28, 21, 0.08) 0%, rgba(75, 80, 213, 0.08) 100%); border-radius: 12px; border: 1px solid rgba(194, 28, 21, 0.2);">
                    <p style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: ${BRAND.primary}; font-family: 'Courier New', monospace;">${otp}</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0 0; color: ${BRAND.gray}; font-size: 13px; line-height: 1.5;">${expiryEn}</p>
              <p style="margin: 4px 0 0 0; color: ${BRAND.grayLight}; font-size: 12px;">${expiryNl}</p>
              <p style="margin: 32px 0 0 0; color: ${BRAND.grayLight}; font-size: 12px; line-height: 1.5;">${footerEn}<br>${footerNl}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0; color: ${BRAND.grayLight}; font-size: 11px; text-align: center;">© ZeeBuddy · Your local community app</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendOtpEmail(to: string, otp: string, purpose = 'verification') {
  const subject =
    purpose === 'reset'
      ? 'Reset your ZeeBuddy password'
      : 'Your ZeeBuddy verification code';
  const html = buildOtpEmailHtml(otp, purpose as 'verification' | 'reset');
  return sendEmail({ to, subject, html, text: `Your code is: ${otp}` });
}
