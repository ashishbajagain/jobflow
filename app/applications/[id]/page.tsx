import { Suspense } from 'react';
import ApplicationDetailPage from './application-detail';
import { PageLoading } from '@/components/skeleton';

export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<PageLoading />}>
      <ApplicationDetailPage params={params} />
    </Suspense>
  );
}
