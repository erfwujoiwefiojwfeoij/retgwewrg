'use client';

import { Suspense } from 'react';
import Appointments from '@/components/account/Appointments';
import { Gate } from '@/components/business/WorkspaceGate';
import { Skeleton } from '@/components/ui/States';

export default function Page() {
  return <Gate>{() => <Suspense fallback={<Skeleton className="h-40" />}><Appointments scope="business" /></Suspense>}</Gate>;
}
