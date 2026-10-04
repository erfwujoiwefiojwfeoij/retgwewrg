'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { STATUS, when } from '@/lib/format';

export default function Page() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api('/api/admin/bookings').then((payload) => setRows(payload.data)); }, []);
  return (
    <div className="divide-y divide-lunea-line border border-lunea-line bg-white text-sm">
      {rows.map((row) => <p key={row.id} className="px-4 py-3">{row.publicId} · {when(row.startAt)} · {row.clientName} · {row.service?.name} · {STATUS[row.status]}</p>)}
    </div>
  );
}
