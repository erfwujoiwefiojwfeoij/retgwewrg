'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { STATUS } from '@/lib/format';

export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { api('/api/admin/reports').then((payload) => setData(payload.data)); }, []);
  if (!data) return null;
  return (
    <ul className="space-y-2 text-sm">
      <li>Записей: {data.bookings}</li>
      {data.byStatus.map((row) => <li key={row.status}>{STATUS[row.status] || row.status}: {row._count}</li>)}
    </ul>
  );
}
