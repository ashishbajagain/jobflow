'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api-client';

export function LoginForm() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);

  const sessionExpired = searchParams.get('session') === 'expired';
  const confirmed = searchParams.get('confirmed') === '1';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        toast({
          title: 'Sign in failed',
          description: 'Unexpected server response. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      const result = await response.json();
      if (!result.success) {
        if (username.includes('@')) setResendEmail(username);
        toast({ title: 'Sign in failed', description: result.error, variant: 'destructive' });
        return;
      }

      const next = searchParams.get('next') || '/';
      // Full navigation ensures the session cookie is sent on the first dashboard load.
      window.location.assign(next);
    } catch {
      toast({ title: 'Sign in failed', description: 'Something went wrong. Try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail.trim()) {
      toast({ title: 'Email required', description: 'Enter the email you registered with.', variant: 'destructive' });
      return;
    }

    setResending(true);
    try {
      const response = await apiFetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      const result = await response.json();
      if (!result.success) {
        toast({ title: 'Could not resend', description: result.error, variant: 'destructive' });
        return;
      }
      toast({
        title: 'Check your email',
        description: result.data?.message || 'If an unverified account exists, a new link was sent.',
      });
    } catch {
      toast({ title: 'Could not resend', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
      setResending(false);
    }
  }

  return (
    <Card className="surface-card border-0 shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-semibold tracking-tight">Welcome back</CardTitle>
        <CardDescription>Sign in to your JobFlow account</CardDescription>
      </CardHeader>
      <CardContent>
        {sessionExpired && (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Your session expired. Please sign in again.
          </p>
        )}
        {confirmed && (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Email confirmed. You can sign in now.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username or email</Label>
            <Input
              id="username"
              autoComplete="username"
              placeholder="username or you@example.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="link-brand text-xs font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="btn-brand w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
          </Button>
        </form>

        {showResend && (
          <form onSubmit={handleResend} className="mt-6 space-y-3 rounded-lg border border-border/60 p-4">
            <p className="text-sm text-muted-foreground">
              Need a new confirmation email? Enter your address below.
            </p>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="outline" className="w-full" disabled={resending}>
              {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resend confirmation'}
            </Button>
          </form>
        )}

        {!showResend && (
          <button
            type="button"
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowResend(true)}
          >
            Resend confirmation email
          </button>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="link-brand font-medium">
            Create account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
