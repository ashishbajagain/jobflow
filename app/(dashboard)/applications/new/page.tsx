import { ApplicationForm } from '@/components/application-form';

export default function NewApplicationPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add Application</h1>
        <p className="text-muted-foreground">Track a new job application in your pipeline</p>
      </div>
      <ApplicationForm mode="create" />
    </div>
  );
}
