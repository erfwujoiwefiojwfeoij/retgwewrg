'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { EmptyState } from '@/components/ui/States';
import { dayLabel } from '@/lib/format';

const STATUS = { WAITING: 'ждёт', OFFERED: 'окно освободилось', DONE: 'записали', DROPPED: 'сняли' };

function Waitlist() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', serviceName: '', wishDate: '', note: '' });
  function load() { api('/api/business/waitlist').then((payload) => setRows(payload.data)).catch(() => setRows([])); }
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <p className="text-sm text-lunea-muted">Если нужный день занят, оставьте человека здесь. Когда запись на эту дату отменят, заявка сама станет «окно освободилось».</p>
      <form className="grid gap-2 border border-lunea-line bg-white p-4 md:grid-cols-2" onSubmit={async (event) => {
        event.preventDefault();
        await api('/api/business/waitlist', { method: 'POST', body: form });
        setForm({ name: '', phone: '', serviceName: '', wishDate: '', note: '' });
        load();
      }}>
        <input className="field" required placeholder="Имя" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="field" required placeholder="Телефон" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <input className="field" required placeholder="Услуга" value={form.serviceName} onChange={(event) => setForm({ ...form, serviceName: event.target.value })} />
        <input className="field" type="date" value={form.wishDate} onChange={(event) => setForm({ ...form, wishDate: event.target.value })} />
        <input className="field md:col-span-2" placeholder="Комментарий" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        <button className="btn md:col-span-2" type="submit">В лист</button>
      </form>
      {!rows.length ? <EmptyState title="Лист пуст" text="Сюда попадают те, кому не нашлось времени." /> : (
        <div className="divide-y divide-lunea-line border border-lunea-line bg-white">
          {rows.map((row) => (
            <article key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p>{row.name} · {row.phone}</p>
                <p className="text-sm text-lunea-muted">{row.serviceName}{row.wishDate ? ` · ${dayLabel(row.wishDate)}` : ''} · {STATUS[row.status]}</p>
                {row.note ? <p className="text-sm">{row.note}</p> : null}
              </div>
              <div className="flex gap-2 text-sm">
                {row.status !== 'DONE' ? <button type="button" onClick={async () => { await api(`/api/business/waitlist/${row.id}`, { method: 'PATCH', body: { status: 'DONE' } }); load(); }}>Записали</button> : null}
                {row.status !== 'DROPPED' ? <button type="button" onClick={async () => { await api(`/api/business/waitlist/${row.id}`, { method: 'PATCH', body: { status: 'DROPPED' } }); load(); }}>Снять</button> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <Gate>{(space) => (space.type === 'salon' ? <Waitlist /> : <EmptyState title="Лист ожидания" text="Его ведёт кабинет." />)}</Gate>;
}
