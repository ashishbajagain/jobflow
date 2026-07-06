export function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes('unique constraint failed') || message.includes('unique constraint');
}
