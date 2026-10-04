'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/services/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { EmptyState, Skeleton } from '@/components/ui/States';
import Select from '@/components/ui/Select';

export function useWorkspace() {
  const [space, setSpace] = useState(undefined);
  useEffect(() => {
    api('/api/business/workspace').then((payload) => setSpace(payload.data)).catch(() => setSpace(null));
  }, []);
  return space;
}

export function CreateSalon({ onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', address: '', city: 'Москва', phone: '' });
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await api('/api/salons', { method: 'POST', body: form });
      onCreated?.();
      window.location.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось открыть кабинет');
    }
  }
  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <h2 className="display text-4xl">Открыть кабинет</h2>
      <p className="text-sm leading-6 text-lunea-muted">Салон, студия, барбершоп или частная практика. Название может быть любым.</p>
      <label className="block"><span className="label">Название</span><input className="field" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
      <label className="block"><span className="label">Описание</span><textarea className="field min-h-28" required minLength={10} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      <label className="block"><span className="label">Адрес</span><input className="field" required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
      <div>
        <label className="label" htmlFor="workspace-city">Город</label>
        <Select id="workspace-city" className="field" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}>
          <option>Москва</option><option>Санкт-Петербург</option><option>Казань</option>
        </Select>
      </div>
      <label className="block"><span className="label">Телефон</span><input className="field" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
      {error ? <p className="text-sm text-lunea-accent">{error}</p> : null}
      <button className="btn" type="submit">Открыть кабинет</button>
    </form>
  );
}

export function Gate({ children }) {
  const { user } = useAuth() || {};
  const space = useWorkspace();
  if (space === undefined) return <Skeleton className="h-40" />;
  if (user && !['SALON_OWNER', 'SALON_ADMIN', 'MASTER', 'SUPER_ADMIN'].includes(user.role)) {
    return <EmptyState title="Это рабочий кабинет" text="Войдите как владелец кабинета или мастер." />;
  }
  if (!space || space.type === 'none') return <CreateSalon />;
  return children(space);
}
