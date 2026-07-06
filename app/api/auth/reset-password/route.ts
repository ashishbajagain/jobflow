import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { resetUserPassword } from '@/lib/auth/service';
import { resetPasswordSchema } from '@/lib/auth/validators';
import { validatePasswordStrength } from '@/lib/auth/password';
import { ensureAppInitialized } from '@/lib/init';
import { parseJsonBody, getClientIp, formatZodErrors } from '@/lib/auth/http';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await ensureAppInitialized();

    const ip = getClientIp(request);
    const rate = checkRateLimit('resetPassword', ip);
    if (!rate.allowed) {
      const { message, status } = rateLimitResponse(rate.retryAfterSec);
      return errorResponse(message, status);
    }

    const body = await parseJsonBody(request);
    if (!body.ok) return body.response;

    const parsed = resetPasswordSchema.safeParse(body.data);
    if (!parsed.success) {
      return errorResponse(formatZodErrors(parsed.error));
    }

    const passwordError = validatePasswordStrength(parsed.data.password);
    if (passwordError) {
      return errorResponse(passwordError);
    }

    const result = await resetUserPassword(parsed.data);
    if (!result.ok) {
      return errorResponse(result.error, result.status);
    }

    return successResponse({ message: 'Password updated successfully. Please sign in.' });
  } catch (error) {
    console.error('POST /api/auth/reset-password:', error);
    return errorResponse('Unable to reset password right now', 500);
  }
}
