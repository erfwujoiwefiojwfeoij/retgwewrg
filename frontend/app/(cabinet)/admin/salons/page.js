'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export default function Page() {
  const [rows, setRows] = useState([]);
  function load() { api('/api/admin/salons').then((payload) => setRows(payload.data)); }
  useEffect(() => { load(); }, []);
  return (
    <div className="divide-y divide-lunea-line border border-lunea-line bg-white">
      {rows.map((salon) => (
        <div key={salon.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <span>{salon.name}<span className="block text-lunea-muted">{salon.city} · {salon.owner?.email}</span></span>
          <span className="flex gap-3">
            <button type="button" onClick={async () => { await api(`/api/admin/salons/${salon.id}`, { method: 'PATCH', body: { verified: !salon.verified } }); load(); }}>{salon.verified ? 'Снять проверку' : 'Проверить'}</button>
            <button type="button" onClick={async () => { if (confirm('Удалить кабинет?')) { await api(`/api/admin/salons/${salon.id}`, { method: 'DELETE' }); load(); } }}>Удалить</button>
          </span>
        </div>
      ))}
    </div>
  );
}
