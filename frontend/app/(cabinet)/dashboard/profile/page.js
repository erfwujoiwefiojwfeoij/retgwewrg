'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/components/providers/AuthProvider';

export default function Page() {
  const { user, refresh } = useAuth() || {};
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      phone: user.profile?.phone || '',
      city: user.profile?.city || '',
      bio: user.profile?.bio || '',
      notifyEmail: user.profile?.notifyEmail !== false,
      avatar: user.profile?.avatar || '',
    });
  }, [user]);
  if (!form) return null;
  async function submit(event) {
    event.preventDefault();
    await api('/api/auth/me', { method: 'PATCH', body: form });
    await refresh?.();
    setMessage('Профиль сохранён');
  }
  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <label className="block"><span className="label">Имя</span><input className="field" required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
      <label className="block"><span className="label">Фамилия</span><input className="field" required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
      <label className="block"><span className="label">Телефон</span><input className="field" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
      <label className="block"><span className="label">Город</span><input className="field" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
      <label className="block"><span className="label">О себе</span><textarea className="field min-h-28" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>
      {message ? <p className="text-sm">{message}</p> : null}
      <button className="btn" type="submit">Сохранить</button>
    </form>
  );
}
