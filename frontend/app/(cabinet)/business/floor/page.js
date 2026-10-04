'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { EmptyState } from '@/components/ui/States';
import Select from '@/components/ui/Select';

function Floor() {
  const [rows, setRows] = useState([]);
  const [closed, setClosed] = useState([]);
  const [name, setName] = useState('');
  const [kind, setKind] = useState('CHAIR');
  const [day, setDay] = useState({ date: '', reason: '' });
  function load() {
    api('/api/business/resources').then((payload) => setRows(payload.data));
    api('/api/business/closures').then((payload) => setClosed(payload.data)).catch(() => setClosed([]));
  }
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]" onSubmit={async (event) => { event.preventDefault(); await api('/api/business/resources', { method: 'POST', body: { name, kind } }); setName(''); load(); }}>
        <input className="field" required placeholder="Название" value={name} onChange={(event) => setName(event.target.value)} />
        <Select className="field" value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="CHAIR">Кресло</option>
          <option value="ROOM">Кабинет</option>
        </Select>
        <button className="btn" type="submit">Добавить</button>
      </form>
      {!rows.length ? <EmptyState title="Зал пуст" text="Добавьте кресло или кабинет, чтобы занимать его в записи." /> : (
        <div className="divide-y divide-lunea-line border border-lunea-line bg-white">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between px-4 py-3">
              <p>{row.name} <span className="text-sm text-lunea-muted">{row.kind === 'ROOM' ? 'кабинет' : 'кресло'}</span></p>
              <button type="button" className="text-sm" onClick={async () => { await api(`/api/business/resources/${row.id}`, { method: 'DELETE' }); load(); }}>Убрать</button>
            </div>
          ))}
        </div>
      )}
      <section className="space-y-3 border-t border-lunea-line pt-6">
        <h2 className="font-display text-2xl">Кабинет закрыт</h2>
        <p className="text-sm text-lunea-muted">В эти дни запись к мастерам не откроется.</p>
        <form className="flex flex-wrap gap-2" onSubmit={async (event) => { event.preventDefault(); await api('/api/business/closures', { method: 'POST', body: day }); setDay({ date: '', reason: '' }); load(); }}>
          <input className="field w-auto" required type="date" value={day.date} onChange={(event) => setDay({ ...day, date: event.target.value })} />
          <input className="field w-auto" placeholder="Причина" value={day.reason} onChange={(event) => setDay({ ...day, reason: event.target.value })} />
          <button className="btn" type="submit">Закрыть день</button>
        </form>
        {closed.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span>{String(item.date).slice(0, 10)} {item.reason || ''}</span>
            <button type="button" onClick={async () => { await api(`/api/business/closures/${item.id}`, { method: 'DELETE' }); load(); }}>Открыть</button>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function Page() {
  return <Gate>{(space) => (space.type === 'salon' ? <Floor /> : <EmptyState title="Зал" text="Ресурсы ведёт кабинет." />)}</Gate>;
}
