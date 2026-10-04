'use client';

import { Gate } from '@/components/business/WorkspaceGate';
import { EmptyState } from '@/components/ui/States';
import RiderStudio from '@/components/business/RiderStudio';

export default function Page() {
  return <Gate>{(space) => (space.type === 'salon' ? <RiderStudio /> : <EmptyState title="Райдер" text="Анкету перед визитом настраивает кабинет." />)}</Gate>;
}
