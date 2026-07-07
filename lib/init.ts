import { ensureDefaultUser } from '@/lib/auth/seed';

let initPromise: Promise<void> | null = null;

export function ensureAppInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = ensureDefaultUser()
      .then(() => undefined)
      .catch((error) => {
        initPromise = null;
        throw error;
      });
  }
  return initPromise;
}
