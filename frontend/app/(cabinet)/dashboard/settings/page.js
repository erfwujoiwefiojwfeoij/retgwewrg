'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/components/providers/AuthProvider';
import Check from '@/components/ui/Check';

export default function Page() {
  const { user, refresh } = useAuth() || {};
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [message, setMessage] = useState('');
  useEffect(() => setNotifyEmail(user?.profile?.notifyEmail !== false), [user]);
  async function submit(event) {
    event.preventDefault();
    await api('/api/auth/me', {
      method: 'PATCH',
      body: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        phone: user.profile.phone || '',
        city: user.profile.city || '',
        bio: user.profile.bio || '',
        notifyEmail,
        avatar: user.profile.avatar || '',
      },
    });
    await refresh?.();
    setMessage('Настройки сохранены');
  }
  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <label className="flex items-center gap-3 text-sm">
        <Check checked={notifyEmail} onChange={(event) => setNotifyEmail(event.target.checked)} />
        Письма о записях
      </label>
      <p className="text-sm text-lunea-muted">Email для входа: {user?.email}. Смена пароля — через «Забыли пароль».</p>
      {message ? <p className="text-sm">{message}</p> : null}
      <button className="btn" type="submit">Сохранить</button>
    </form>
  );
}
