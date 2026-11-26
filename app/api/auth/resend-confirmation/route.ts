import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { resendConfirmationEmail } from '@/lib/auth/service';
import { resendConfirmationSchema } from '@/lib/auth/validators';
import { ensureAppInitialized } from '@/lib/init';
import { parseJsonBody, getClientIp, formatZodErrors, getAppUrl } from '@/lib/auth/http';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await ensureAppInitialized();

    const ip = getClientIp(request);
    const rate = checkRateLimit('resendConfirmation', ip);
    if (!rate.allowed) {
      const { message, status } = rateLimitResponse(rate.retryAfterSec);
      return errorResponse(message, status);
    }

    const body = await parseJsonBody(request);
    if (!body.ok) return body.response;

    const parsed = resendConfirmationSchema.safeParse(body.data);
    if (!parsed.success) {
      return errorResponse(formatZodErrors(parsed.error));
    }

    const result = await resendConfirmationEmail(parsed.data, getAppUrl(request));
    return successResponse({ message: result.message });
  } catch (error) {
    console.error('POST /api/auth/resend-confirmation:', error);
    return errorResponse('Unable to resend confirmation right now', 500);
  }
}
