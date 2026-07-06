import { ensureDefaultUser } from '@/lib/auth/seed';

let initPromise: Promise<number> | null = null;

export function ensureAppInitialized(): Promise<number> {
  if (!initPromise) {
    initPromise = ensureDefaultUser().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}
