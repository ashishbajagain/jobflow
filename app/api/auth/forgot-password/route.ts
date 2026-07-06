import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { requestPasswordReset } from '@/lib/auth/service';
import { forgotPasswordSchema } from '@/lib/auth/validators';
import { ensureAppInitialized } from '@/lib/init';
import { parseJsonBody, getClientIp, formatZodErrors } from '@/lib/auth/http';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit';

export const dynamic = 'force-dynamic';

function getAppUrl(request: NextRequest): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    await ensureAppInitialized();

    const ip = getClientIp(request);
    const rate = checkRateLimit('forgotPassword', ip);
    if (!rate.allowed) {
      const { message, status } = rateLimitResponse(rate.retryAfterSec);
      return errorResponse(message, status);
    }

    const body = await parseJsonBody(request);
    if (!body.ok) return body.response;

    const parsed = forgotPasswordSchema.safeParse(body.data);
    if (!parsed.success) {
      return errorResponse(formatZodErrors(parsed.error));
    }

    const result = await requestPasswordReset(parsed.data, getAppUrl(request));
    return successResponse({ message: result.message });
  } catch (error) {
    console.error('POST /api/auth/forgot-password:', error);
    return errorResponse('Unable to process request right now', 500);
  }
}
