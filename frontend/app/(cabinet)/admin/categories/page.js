'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export default function Page() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', nameEn: '' });
  function load() { api('/api/admin/categories').then((payload) => setRows(payload.data)); }
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-2" onSubmit={async (event) => { event.preventDefault(); await api('/api/admin/categories', { method: 'POST', body: form }); setForm({ name: '', nameEn: '' }); load(); }}>
        <input className="field w-auto" placeholder="Название" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="field w-auto" placeholder="English" required value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} />
        <button className="btn" type="submit">Добавить</button>
      </form>
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between border-b border-lunea-line py-2 text-sm">
          <span>{row.name} · {row.nameEn} · {row._count.services}</span>
          <button type="button" onClick={async () => { await api(`/api/admin/categories/${row.id}`, { method: 'DELETE' }); load(); }}>Удалить</button>
        </div>
      ))}
    </div>
  );
}
