import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { getOptionalAuthenticatedSession } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await getOptionalAuthenticatedSession();
  if (session) redirect('/');

  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <LoginForm />
    </Suspense>
  );
}
