import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { loginUser } from '@/lib/auth/service';
import { loginSchema } from '@/lib/auth/validators';
import { setSessionCookie } from '@/lib/auth/cookies';
import { ensureAppInitialized } from '@/lib/init';
import { parseJsonBody, getClientIp, formatZodErrors } from '@/lib/auth/http';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await ensureAppInitialized();

    const ip = getClientIp(request);
    const rate = checkRateLimit('login', ip);
    if (!rate.allowed) {
      const { message, status } = rateLimitResponse(rate.retryAfterSec);
      return errorResponse(message, status);
    }

    const body = await parseJsonBody(request);
    if (!body.ok) return body.response;

    const parsed = loginSchema.safeParse(body.data);
    if (!parsed.success) {
      return errorResponse(formatZodErrors(parsed.error));
    }

    const result = await loginUser(parsed.data, {
      ipAddress: ip,
      userAgent: request.headers.get('user-agent'),
    });

    if (!result.ok) {
      return errorResponse(result.error, result.status);
    }

    const response = successResponse({ user: result.user });
    setSessionCookie(response, result.token, result.expiresAt);
    return response;
  } catch (error) {
    console.error('POST /api/auth/login:', error);
    return errorResponse('Unable to sign in right now', 500);
  }
}
