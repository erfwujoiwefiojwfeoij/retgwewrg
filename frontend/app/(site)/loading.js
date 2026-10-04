import { Skeleton } from '@/components/ui/States';

export default function Loading() {
  return (
    <div className="page pt-32">
      <Skeleton className="mx-auto h-8 w-48" />
      <Skeleton className="mx-auto mt-6 h-24 w-full max-w-3xl" />
      <Skeleton className="mx-auto mt-8 h-40 max-w-xl" />
    </div>
  );
}
