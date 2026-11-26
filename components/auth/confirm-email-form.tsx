'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Status = 'loading' | 'success' | 'error';

export function ConfirmEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(
    token ? 'Confirming your email…' : 'This confirmation link is missing or invalid.'
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function confirm() {
      try {
        const response = await fetch('/api/auth/confirm-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const result = await response.json();
        if (cancelled) return;

        if (!result.success) {
          setStatus('error');
          setMessage(result.error || 'Unable to confirm email.');
          return;
        }

        setStatus('success');
        setMessage(result.data?.message || 'Email confirmed. You can now sign in.');
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Something went wrong while confirming your email.');
        }
      }
    }

    void confirm();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <Card className="surface-card border-0 shadow-lg">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
          {status === 'success' && <CheckCircle2 className="h-6 w-6 text-primary" />}
          {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
        </div>
        <CardTitle className="text-xl">
          {status === 'loading' && 'Confirming email'}
          {status === 'success' && 'Email confirmed'}
          {status === 'error' && 'Confirmation failed'}
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === 'success' && (
          <Link href="/login">
            <Button className="btn-brand w-full">Sign in</Button>
          </Link>
        )}
        {status === 'error' && (
          <>
            <Link href="/login">
              <Button className="btn-brand w-full">Back to sign in</Button>
            </Link>
            <p className="text-center text-sm text-muted-foreground">
              Need a new link? Use “Resend confirmation” on the sign-in page.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
