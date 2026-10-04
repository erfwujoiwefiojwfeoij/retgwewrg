'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { WEEKDAYS } from '@/lib/format';
import Check from '@/components/ui/Check';

function Settings({ space }) {
  const salon = space.salon;
  const [form, setForm] = useState(null);
  const [branch, setBranch] = useState({ name: '', address: '', city: salon?.city || 'Москва', phone: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!salon) return;
    api(`/api/salons/${salon.slug}`).then((payload) => {
      const data = payload.data;
      setForm({
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        phone: data.phone || '',
        hours: data.hours,
        branches: data.branches,
      });
    });
  }, [salon?.slug]);

  if (!salon) return <p className="text-sm text-lunea-muted">Часы независимого мастера меняются в разделе мастеров владельца или через профиль.</p>;
  if (!form) return null;

  async function save(event) {
    event.preventDefault();
    await api(`/api/salons/${salon.id}`, { method: 'PATCH', body: form });
    setMessage('Кабинет сохранён');
  }

  async function addBranch(event) {
    event.preventDefault();
    await api(`/api/salons/${salon.id}/branches`, { method: 'POST', body: branch });
    window.location.reload();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={save} className="space-y-3">
        <label className="block"><span className="label">Название</span><input className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label className="block"><span className="label">Описание</span><textarea className="field min-h-28" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <label className="block"><span className="label">Адрес</span><input className="field" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
        <label className="block"><span className="label">Телефон</span><input className="field" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
        <p className="label">Часы работы</p>
        {form.hours.map((hour, index) => (
          <div key={hour.id || hour.dayOfWeek} className="grid grid-cols-4 gap-2 text-sm">
            <span>{WEEKDAYS[hour.dayOfWeek]}</span>
            <input className="field h-9" value={hour.startTime} onChange={(event) => { const hours = [...form.hours]; hours[index] = { ...hour, startTime: event.target.value }; setForm({ ...form, hours }); }} />
            <input className="field h-9" value={hour.endTime} onChange={(event) => { const hours = [...form.hours]; hours[index] = { ...hour, endTime: event.target.value }; setForm({ ...form, hours }); }} />
            <label className="inline-flex items-center gap-2"><Check checked={hour.isOff} onChange={(event) => { const hours = [...form.hours]; hours[index] = { ...hour, isOff: event.target.checked }; setForm({ ...form, hours }); }} />выходной</label>
          </div>
        ))}
        {message ? <p className="text-sm">{message}</p> : null}
        <p className="text-sm text-lunea-muted">Подписка: {salon.subscription?.plan} / {salon.subscription?.status}</p>
        <button className="btn" type="submit">Сохранить</button>
      </form>
      <form onSubmit={addBranch} className="space-y-3">
        <h2 className="font-display text-2xl">Филиал</h2>
        {(form.branches || []).map((item) => (
          <p key={item.id} className="flex justify-between text-sm">{item.name}<button type="button" onClick={async () => { await api(`/api/branches/${item.id}`, { method: 'DELETE' }); window.location.reload(); }}>Удалить</button></p>
        ))}
        <input className="field" placeholder="Название" required value={branch.name} onChange={(event) => setBranch({ ...branch, name: event.target.value })} />
        <input className="field" placeholder="Адрес" required value={branch.address} onChange={(event) => setBranch({ ...branch, address: event.target.value })} />
        <button className="btn btn-line" type="submit">Добавить филиал</button>
      </form>
    </div>
  );
}

export default function Page() {
  return <Gate>{(space) => <Settings space={space} />}</Gate>;
}
