'use client';

import Messages from '@/components/account/Messages';
import { Gate } from '@/components/business/WorkspaceGate';

export default function Page() {
  return <Gate>{() => <Messages scope="business" />}</Gate>;
}
