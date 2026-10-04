'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export default function Page() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  function load(value = q) { api(`/api/admin/users?q=${encodeURIComponent(value)}&pageSize=40`).then((payload) => setRows(payload.data)); }
  useEffect(() => { load(''); }, []);
  return (
    <div>
      <form className="mb-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); load(); }}>
        <input className="field" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Email или имя" />
        <button className="btn" type="submit">Найти</button>
      </form>
      <div className="divide-y divide-lunea-line border border-lunea-line bg-white">
        {rows.map((user) => (
          <div key={user.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{user.profile?.firstName} {user.profile?.lastName}<span className="block text-lunea-muted">{user.email} · {user.role}</span></span>
            <button type="button" onClick={async () => { await api(`/api/admin/users/${user.id}`, { method: 'PATCH', body: { banned: !user.banned } }); load(); }}>{user.banned ? 'Разблокировать' : 'Заблокировать'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
