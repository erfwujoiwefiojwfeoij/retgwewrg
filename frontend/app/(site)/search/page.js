import { Suspense } from 'react';
import SearchPage from '@/components/search/SearchPage';
import { Skeleton } from '@/components/ui/States';

export const metadata = { title: 'Поиск', alternates: { canonical: '/search' } };

export default function Page() {
  return (
    <Suspense fallback={<div className="page pt-28"><Skeleton className="h-40" /></div>}>
      <SearchPage />
    </Suspense>
  );
}
