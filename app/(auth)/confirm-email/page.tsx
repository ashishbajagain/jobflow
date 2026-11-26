import { Suspense } from 'react';
import { ConfirmEmailForm } from '@/components/auth/confirm-email-form';

export const dynamic = 'force-dynamic';

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <ConfirmEmailForm />
    </Suspense>
  );
}
