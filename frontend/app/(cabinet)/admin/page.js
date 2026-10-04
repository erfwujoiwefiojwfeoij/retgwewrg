'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { money } from '@/lib/format';

export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { api('/api/admin/reports').then((payload) => setData(payload.data)); }, []);
  if (!data) return null;
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {[
        ['Пользователи', data.users],
        ['Кабинеты', data.salons],
        ['Мастера', data.masters],
        ['Выручка', money(data.revenue)],
      ].map(([label, value]) => (
        <div key={label} className="border border-lunea-line bg-white p-4">
          <p className="text-xs text-lunea-muted">{label}</p>
          <p className="font-display text-3xl">{value}</p>
        </div>
      ))}
    </div>
  );
}
