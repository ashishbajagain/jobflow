import { initializeAuthAndSeed } from '@/lib/auth/seed';

let initialized = false;

export async function ensureAppInitialized(): Promise<void> {
  if (initialized) return;
  await initializeAuthAndSeed();
  initialized = true;
}
