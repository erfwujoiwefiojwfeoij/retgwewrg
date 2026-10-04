'use client';

import { useParams } from 'next/navigation';
import RiderSheet from '@/components/rider/RiderSheet';

export default function Page() {
  const params = useParams();
  return <RiderSheet slug={params.slug} />;
}
