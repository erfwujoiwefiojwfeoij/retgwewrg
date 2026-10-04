'use client';

import { Suspense } from 'react';
import Appointments from '@/components/account/Appointments';
import { Skeleton } from '@/components/ui/States';

export default function Page() {
  return <Suspense fallback={<Skeleton className="h-40" />}><Appointments /></Suspense>;
}
