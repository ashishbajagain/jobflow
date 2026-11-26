import { BRAND } from '../brand';

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = `${BRAND.name} <noreply@ashishb.com.np>`;

function getEmailFrom(): string {
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  if (process.env.NODE_ENV === 'production' && /@resend\.dev\b/i.test(from)) {
    throw new Error(
      'EMAIL_FROM must use your verified domain (e.g. noreply@ashishb.com.np). onboarding@resend.dev can only email your own address.'
    );
  }
  return from;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildButtonEmail(input: {
  subject: string;
  greeting: string;
  intro: string;
  buttonLabel: string;
  actionUrl: string;
  expiryNote: string;
  footer: string;
}) {
  const safeName = escapeHtml(input.greeting);
  const text = [
    `Hi ${input.greeting},`,
    '',
    input.intro,
    '',
    input.actionUrl,
    '',
    input.expiryNote,
    '',
    input.footer,
    '',
    `— ${BRAND.name}`,
  ].join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
      <p>Hi ${safeName},</p>
      <p>${escapeHtml(input.intro)}</p>
      <p>
        <a href="${escapeHtml(input.actionUrl)}" style="display: inline-block; background: #1f7a6f; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">
          ${escapeHtml(input.buttonLabel)}
        </a>
      </p>
      <p style="font-size: 14px; color: #666;">${escapeHtml(input.expiryNote)} If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="font-size: 13px; word-break: break-all; color: #444;">${escapeHtml(input.actionUrl)}</p>
      <p style="font-size: 14px; color: #666;">${escapeHtml(input.footer)}</p>
      <p style="font-size: 14px; color: #888;">— ${escapeHtml(BRAND.name)}</p>
    </div>
  `.trim();

  return { subject: input.subject, text, html };
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

async function deliverEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  logLabel: string;
}): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend(input);
      return;
    } catch (error) {
      // In development, still surface the link so auth flows are testable
      // (Resend's onboarding domain only delivers to the account owner's email).
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          `[auth] Resend failed for ${input.to}:`,
          error instanceof Error ? error.message : error
        );
        console.info(`[auth] ${input.logLabel} for ${input.to}:\n${input.text}`);
        return;
      }
      throw error;
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info(`[auth] ${input.logLabel} for ${input.to}:\n${input.text}`);
    return;
  }

  throw new Error(
    `Email service is not configured. Set RESEND_API_KEY to enable ${input.logLabel.toLowerCase()}.`
  );
}

export async function sendPasswordResetEmail(input: {
  to: string;
  username: string;
  resetUrl: string;
}): Promise<void> {
  const { subject, text, html } = buildButtonEmail({
    subject: `Reset your ${BRAND.name} password`,
    greeting: input.username,
    intro: `We received a request to reset your ${BRAND.name} password. Click the button below to choose a new password.`,
    buttonLabel: 'Reset password',
    actionUrl: input.resetUrl,
    expiryNote: 'This link expires in 1 hour.',
    footer: "If you didn't request this, you can safely ignore this email.",
  });

  await deliverEmail({
    to: input.to,
    subject,
    text,
    html,
    logLabel: 'Password reset link',
  });
}

export async function sendEmailConfirmation(input: {
  to: string;
  username: string;
  confirmUrl: string;
}): Promise<void> {
  const { subject, text, html } = buildButtonEmail({
    subject: `Confirm your ${BRAND.name} email`,
    greeting: input.username,
    intro: `Thanks for signing up for ${BRAND.name}. Please confirm your email address to activate your account.`,
    buttonLabel: 'Confirm email',
    actionUrl: input.confirmUrl,
    expiryNote: 'This link expires in 24 hours.',
    footer: "If you didn't create an account, you can safely ignore this email.",
  });

  await deliverEmail({
    to: input.to,
    subject,
    text,
    html,
    logLabel: 'Email confirmation link',
  });
}
