import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { registerUser } from '@/lib/auth/service';
import { registerSchema } from '@/lib/auth/validators';
import { validatePasswordStrength } from '@/lib/auth/password';
import { ensureAppInitialized } from '@/lib/init';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  await ensureAppInitialized();

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || 'Invalid input');
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
