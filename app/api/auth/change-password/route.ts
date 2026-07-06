import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { requireAuth } from '@/lib/auth/guards';
import { changeUserPassword } from '@/lib/auth/service';
import { changePasswordSchema } from '@/lib/auth/validators';
import { validatePasswordStrength } from '@/lib/auth/password';
import { ensureAppInitialized } from '@/lib/init';
import { parseJsonBody, getClientIp, formatZodErrors } from '@/lib/auth/http';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await ensureAppInitialized();

    const auth = await requireAuth(request);
    if ('response' in auth) return auth.response;

    const ip = getClientIp(request);
    const rate = checkRateLimit('changePassword', `${auth.session.userId}:${ip}`);
    if (!rate.allowed) {
      const { message, status } = rateLimitResponse(rate.retryAfterSec);
      return errorResponse(message, status);
    }

    const body = await parseJsonBody(request);
    if (!body.ok) return body.response;

    const parsed = changePasswordSchema.safeParse(body.data);
    if (!parsed.success) {
      return errorResponse(formatZodErrors(parsed.error));
    }

    const passwordError = validatePasswordStrength(parsed.data.newPassword);
    if (passwordError) {
      return errorResponse(passwordError);
    }

    const result = await changeUserPassword(auth.session.userId, parsed.data);
    if (!result.ok) {
      return errorResponse(result.error, result.status);
    }

    return successResponse({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('POST /api/auth/change-password:', error);
    return errorResponse('Unable to change password right now', 500);
  }
}
