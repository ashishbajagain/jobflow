import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';
import { getOptionalAuthenticatedSession } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const session = await getOptionalAuthenticatedSession();
  if (session) redirect('/');

  return <RegisterForm />;
}
