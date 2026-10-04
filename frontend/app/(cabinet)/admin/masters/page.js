'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export default function Page() {
  const [rows, setRows] = useState([]);
  function load() { api('/api/admin/masters').then((payload) => setRows(payload.data)); }
  useEffect(() => { load(); }, []);
  return (
    <div className="divide-y divide-lunea-line border border-lunea-line bg-white">
      {rows.map((master) => (
        <div key={master.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <span>{master.firstName} {master.lastName}<span className="block text-lunea-muted">{master.specialization} · {master.salon?.name || 'самостоятельно'}</span></span>
          <button type="button" onClick={async () => { await api(`/api/admin/masters/${master.id}`, { method: 'PATCH', body: { verified: !master.verified } }); load(); }}>{master.verified ? 'Снять проверку' : 'Проверить'}</button>
        </div>
      ))}
    </div>
  );
}
