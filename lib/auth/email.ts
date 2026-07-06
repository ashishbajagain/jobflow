import { BRAND } from '../brand';

export async function sendPasswordResetEmail(input: {
  to: string;
  username: string;
  resetUrl: string;
}): Promise<void> {
  const subject = `Reset your ${BRAND.name} password`;
  const text = [
    `Hi ${input.username},`,
    '',
    `We received a request to reset your ${BRAND.name} password.`,
    `Click the link below to choose a new password (expires in 1 hour):`,
    '',
    input.resetUrl,
    '',
    `If you didn't request this, you can safely ignore this email.`,
    '',
    `— ${BRAND.name}`,
  ].join('\n');

  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'JobFlow <onboarding@resend.dev>',
        to: input.to,
        subject,
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to send reset email: ${body}`);
    }
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info(`[auth] Password reset link for ${input.to}: ${input.resetUrl}`);
    return;
  }

  throw new Error('Email service is not configured. Set RESEND_API_KEY to enable password reset emails.');
}
