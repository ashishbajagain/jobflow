'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { registerFormSchema } from '@/lib/auth/validators';
import { validatePasswordStrength } from '@/lib/auth/password';

type FieldErrors = Partial<Record<'username' | 'email' | 'displayName' | 'password' | 'confirmPassword', string>>;

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateClient(): boolean {
    const parsed = registerFormSchema.safeParse(form);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && !errors[field as keyof FieldErrors]) {
          errors[field as keyof FieldErrors] = issue.message;
        }
      }
      setFieldErrors(errors);
      return false;
    }

    const passwordError = validatePasswordStrength(form.password);
    if (passwordError) {
      setFieldErrors({ password: passwordError });
      return false;
    }

    setFieldErrors({});
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateClient()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          displayName: form.displayName || undefined,
          password: form.password,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        toast({
          title: 'Registration failed',
          description: 'Unexpected server response. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      const result = await response.json();
      if (!result.success) {
        toast({ title: 'Registration failed', description: result.error, variant: 'destructive' });
        return;
      }

      toast({ title: 'Account created', description: 'You can now sign in with your new account.' });
      router.push('/login');
      router.refresh();
    } catch {
      toast({
        title: 'Registration failed',
        description: 'Network error. Check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="surface-card border-0 shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-semibold tracking-tight">Create your account</CardTitle>
        <CardDescription>Start tracking your job search in one place</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              placeholder="Choose a username"
              value={form.username}
              onChange={(e) => updateField('username', e.target.value)}
              aria-invalid={!!fieldErrors.username}
              required
            />
            {fieldErrors.username && (
              <p className="text-xs text-destructive">{fieldErrors.username}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              aria-invalid={!!fieldErrors.email}
              required
            />
            {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name (optional)</Label>
            <Input
              id="displayName"
              autoComplete="name"
              placeholder="Your name"
              value={form.displayName}
              onChange={(e) => updateField('displayName', e.target.value)}
              aria-invalid={!!fieldErrors.displayName}
            />
            {fieldErrors.displayName && (
              <p className="text-xs text-destructive">{fieldErrors.displayName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                aria-invalid={!!fieldErrors.password}
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
            {fieldErrors.password ? (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                At least 8 characters with uppercase, lowercase, and a number. No spaces.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              aria-invalid={!!fieldErrors.confirmPassword}
              required
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
            )}
          </div>
          <Button type="submit" className="btn-brand w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="link-brand font-medium">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
