import type { NextRequest } from 'next/server';
import type { ZodError } from 'zod';
import { errorResponse } from '../api-utils';

const MAX_JSON_BODY_BYTES = 16 * 1024;

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function parseJsonBody<T = unknown>(
  request: NextRequest
): Promise<{ ok: true; data: T } | { ok: false; response: ReturnType<typeof errorResponse> }> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return { ok: false, response: errorResponse('Content-Type must be application/json', 415) };
  }

  const raw = await request.text();
  if (raw.length === 0) {
    return { ok: false, response: errorResponse('Request body is required', 400) };
  }
  if (raw.length > MAX_JSON_BODY_BYTES) {
    return { ok: false, response: errorResponse('Request body is too large', 413) };
  }

  try {
    return { ok: true, data: JSON.parse(raw) as T };
  } catch {
    return { ok: false, response: errorResponse('Invalid JSON body', 400) };
  }
}

export function formatZodErrors(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join('. ');
}
