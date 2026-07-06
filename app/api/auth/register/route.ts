import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { registerUser } from '@/lib/auth/service';
import { registerSchema } from '@/lib/auth/validators';
import { validatePasswordStrength } from '@/lib/auth/password';
import { ensureAppInitialized } from '@/lib/init';
import { parseJsonBody, getClientIp, formatZodErrors } from '@/lib/auth/http';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await ensureAppInitialized();

    const ip = getClientIp(request);
    const rate = checkRateLimit('register', ip);
    if (!rate.allowed) {
      const { message, status } = rateLimitResponse(rate.retryAfterSec);
      return errorResponse(message, status);
    }

    const body = await parseJsonBody(request);
    if (!body.ok) return body.response;

    const parsed = registerSchema.safeParse(body.data);
    if (!parsed.success) {
      return errorResponse(formatZodErrors(parsed.error));
    }

    const passwordError = validatePasswordStrength(parsed.data.password);
    if (passwordError) {
      return errorResponse(passwordError);
    }

    const result = await registerUser(parsed.data);
    if (!result.ok) {
      return errorResponse(result.error, result.status);
    }

    return successResponse({ user: result.user }, 201);
  } catch (error) {
    console.error('POST /api/auth/register:', error);
    return errorResponse('Unable to create account right now', 500);
  }
}
