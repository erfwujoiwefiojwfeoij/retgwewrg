'use client';

import CalendarBoard from '@/components/business/CalendarBoard';
import { Gate } from '@/components/business/WorkspaceGate';

export default function Page() {
  return <Gate>{() => <CalendarBoard />}</Gate>;
}
