import nodemailer from 'nodemailer';

// Hostnet SMTP credentials
const FALLBACK_SMTP_USER = 'redactie@zeeburgereiland.app';
const FALLBACK_SMTP_PASS = 'ZBuddy2026!';

// Build transporter
function getTransporter() {
  const isDev = process.env.NODE_ENV === 'development';

  const user = isDev
    ? FALLBACK_SMTP_USER
    : (process.env.SMTP_USER || FALLBACK_SMTP_USER);

  const rawPass = isDev
    ? FALLBACK_SMTP_PASS
    : (process.env.SMTP_PASS || FALLBACK_SMTP_PASS);

  const pass =
    typeof rawPass === 'string'
      ? rawPass.replace(/\s/g, '')
      : rawPass;

  const host = process.env.SMTP_HOST || 'smtp.hostnet.nl';
  const port = Number(process.env.SMTP_PORT) || 587;

  return nodemailer.createTransport({
    host,
    port,
    secure: false, // true only for 465
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
}: SendEmailOptions) {
  const transporter = getTransporter();

  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    FALLBACK_SMTP_USER;

  return transporter.sendMail({
    from: `"Z Buddy" <${from}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    text: text ?? '',
    html: html ?? text ?? '',
    replyTo,
  });
}

/** Brand colors matching the web app theme */
const BRAND = {
  primary: '#000000',
  secondary: '#121212',
  gray: '#A0A0A0',
  grayLight: '#666666',
  white: '#FFFFFF',
} as const;

/**
 * Generates bilingual OTP email template
 */
function buildOtpEmailHtml(
  otp: string,
  purpose: 'verification' | 'reset'
): string {
  const isReset = purpose === 'reset';

  const titleEn = isReset
    ? 'Reset your password'
    : 'Your verification code';

  const titleNl = isReset
    ? 'Reset je wachtwoord'
    : 'Je verificatiecode';

  const introEn = isReset
    ? 'Use the code below to reset your Z Buddy password.'
    : 'Use the code below to verify your Z Buddy account.';

  const introNl = isReset
    ? 'Gebruik de onderstaande code om je Z Buddy-wachtwoord te resetten.'
    : 'Gebruik de onderstaande code om je Z Buddy-account te verifiëren.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Z Buddy OTP</title>
</head>

<body style="margin:0;padding:0;background:#0A0A0A;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:40px 20px;">

<table width="100%" cellpadding="0" cellspacing="0"
style="max-width:480px;background:#121212;border-radius:16px;overflow:hidden;border:1px solid #222222;">

<tr>
<td style="background:#000000;padding:32px 40px;text-align:center;border-bottom:1px solid #222222;">

<h1 style="margin:0;color:#FFFFFF;font-size:28px;font-weight:800;letter-spacing:1px;">
Z Buddy
</h1>

<p style="margin:8px 0 0;color:${BRAND.gray};font-size:14px;">
${titleEn} · ${titleNl}
</p>

</td>
</tr>

<tr>
<td style="padding:40px;">

<p style="font-size:16px;color:#FFFFFF;margin-top:0;">
${introEn}
</p>

<p style="font-size:14px;color:${BRAND.gray};margin-bottom:0;">
${introNl}
</p>

<div
style="margin-top:32px;padding:24px;border-radius:12px;
background:#1F1F1F;
text-align:center;
border:1px solid #333333;">

<p
style="margin:0;
font-size:32px;
font-weight:700;
letter-spacing:8px;
color:#FFFFFF;
font-family:Courier New, monospace;">

${otp}

</p>
</div>

<p style="margin-top:32px;font-size:13px;color:${BRAND.gray};">
This code expires in 10 minutes. Do not share it with anyone.
</p>

<p style="font-size:12px;color:${BRAND.grayLight};margin-bottom:0;">
Deze code verloopt over 10 minuten. Deel deze niet met anderen.
</p>

</td>
</tr>

<tr>
<td
style="padding:24px 40px;background:#000000;border-top:1px solid #222222;">

<p
style="margin:0;font-size:11px;color:${BRAND.grayLight};text-align:center;">

© Z Buddy · Your local community app

</p>

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

export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: 'verification' | 'reset' = 'verification'
) {
  const subject =
    purpose === 'reset'
      ? 'Reset your Z Buddy password'
      : 'Your Z Buddy verification code';

  const html = buildOtpEmailHtml(otp, purpose);

  return sendEmail({
    to,
    subject,
    html,
    text: `Your verification code is: ${otp}`,
  });
}
