'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export default function Page() {
  const [rows, setRows] = useState([]);
  function load() { api('/api/admin/settings').then((payload) => setRows(payload.data)); }
  useEffect(() => { load(); }, []);
  return (
    <div className="max-w-lg space-y-3">
      {rows.map((row) => (
        <form key={row.key} className="grid grid-cols-[140px_1fr_auto] gap-2" onSubmit={async (event) => { event.preventDefault(); const value = new FormData(event.currentTarget).get('value'); await api('/api/admin/settings', { method: 'PUT', body: { key: row.key, value } }); load(); }}>
          <span className="self-center text-sm">{row.key}</span>
          <input name="value" className="field" defaultValue={row.value} />
          <button className="btn" type="submit">Ок</button>
        </form>
      ))}
    </div>
  );
}
