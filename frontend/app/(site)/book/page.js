import { Suspense } from 'react';
import BookingFlow from '@/components/booking/BookingFlow';
import { Skeleton } from '@/components/ui/States';

export const metadata = { title: 'Запись' };

export default function Page() {
  return (
    <div className="page max-w-3xl pb-24 pt-28">
      <p className="eyebrow">Booking</p>
      <h1 className="display mt-3 text-5xl">Запись</h1>
      <div className="mt-8">
        <Suspense fallback={<Skeleton className="h-40" />}>
          <BookingFlow />
        </Suspense>
      </div>
    </div>
  );
}
