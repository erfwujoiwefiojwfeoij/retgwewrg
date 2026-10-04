'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import BookingFlow from '@/components/booking/BookingFlow';
import { Skeleton } from '@/components/ui/States';

export default function Page() {
  const params = useParams();
  return (
    <div className="min-h-screen bg-[#FFF9FA] px-4 py-8">
      <Suspense fallback={<Skeleton className="h-40" />}>
        <BookingFlow salonSlug={params.slug} />
      </Suspense>
    </div>
  );
}
