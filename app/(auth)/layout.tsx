import Link from 'next/link';
import { Workflow } from 'lucide-react';
import { BRAND } from '@/lib/brand';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-background to-accent/30 px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-700 to-teal-800 shadow-sm">
          <Workflow className="h-5 w-5 text-white" />
        </div>
        <div>
          <Link href="/login" className="font-semibold tracking-tight text-foreground">
            {BRAND.name}
          </Link>
          <p className="text-xs text-muted-foreground">{BRAND.tagline}</p>
        </div>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
