import { BRAND } from '../brand';

const RESEND_API_URL = 'https://api.resend.com/emails';

function getEmailFrom(): string {
  return process.env.EMAIL_FROM || 'onboarding@resend.dev';
}

function buildResetEmail(input: { username: string; resetUrl: string }) {
  const subject = `Reset your ${BRAND.name} password`;
  const text = [
    `Hi ${input.username},`,
    '',
    `We received a request to reset your ${BRAND.name} password.`,
    'Click the link below to choose a new password (expires in 1 hour):',
    '',
    input.resetUrl,
    '',
    "If you didn't request this, you can safely ignore this email.",
    '',
    `— ${BRAND.name}`,
  ].join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
      <p>Hi ${input.username},</p>
      <p>We received a request to reset your <strong>${BRAND.name}</strong> password.</p>
      <p>
        <a href="${input.resetUrl}" style="display: inline-block; background: #1f7a6f; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">
          Reset password
        </a>
      </p>
      <p style="font-size: 14px; color: #666;">This link expires in 1 hour. If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="font-size: 13px; word-break: break-all; color: #444;">${input.resetUrl}</p>
      <p style="font-size: 14px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
      <p style="font-size: 14px; color: #888;">— ${BRAND.name}</p>
    </div>
  `.trim();

  return { subject, text, html };
}

async function sendViaResend(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!response.ok) {
    let detail = await response.text();
    try {
      const parsed = JSON.parse(detail) as { message?: string };
      if (parsed.message) detail = parsed.message;
    } catch {
      // keep raw body
    }
    throw new Error(`Resend error (${response.status}): ${detail}`);
  }
}

export async function sendPasswordResetEmail(input: {
  to: string;
  username: string;
  resetUrl: string;
}): Promise<void> {
  const { subject, text, html } = buildResetEmail({
    username: input.username,
    resetUrl: input.resetUrl,
  });

  if (process.env.RESEND_API_KEY) {
    await sendViaResend({ to: input.to, subject, text, html });
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info(`[auth] Password reset link for ${input.to}: ${input.resetUrl}`);
    return;
  }

  throw new Error('Email service is not configured. Set RESEND_API_KEY to enable password reset emails.');
}
