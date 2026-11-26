import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { confirmUserEmail } from '@/lib/auth/service';
import { confirmEmailSchema } from '@/lib/auth/validators';
import { ensureAppInitialized } from '@/lib/init';
import { parseJsonBody, getClientIp, formatZodErrors } from '@/lib/auth/http';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await ensureAppInitialized();

    const ip = getClientIp(request);
    const rate = checkRateLimit('confirmEmail', ip);
    if (!rate.allowed) {
      const { message, status } = rateLimitResponse(rate.retryAfterSec);
      return errorResponse(message, status);
    }

    const body = await parseJsonBody(request);
    if (!body.ok) return body.response;

    const parsed = confirmEmailSchema.safeParse(body.data);
    if (!parsed.success) {
      return errorResponse(formatZodErrors(parsed.error));
    }

    const result = await confirmUserEmail(parsed.data);
    if (!result.ok) {
      return errorResponse(result.error, result.status);
    }

    return successResponse({ message: result.message });
  } catch (error) {
    console.error('POST /api/auth/confirm-email:', error);
    return errorResponse('Unable to confirm email right now', 500);
  }
}
