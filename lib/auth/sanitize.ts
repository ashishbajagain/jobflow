const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export function stripControlCharacters(value: string): string {
  return value.replace(CONTROL_CHARS, '');
}

export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function sanitizeUsername(value: string): string {
  return stripControlCharacters(value).trim().toLowerCase();
}

export function sanitizeEmail(value: string): string {
  return stripControlCharacters(value).trim().toLowerCase();
}

export function sanitizeDisplayName(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const cleaned = normalizeWhitespace(stripControlCharacters(value));
  return cleaned.length > 0 ? cleaned : undefined;
}

export function containsHtml(value: string): boolean {
  return /[<>]/.test(value);
}
