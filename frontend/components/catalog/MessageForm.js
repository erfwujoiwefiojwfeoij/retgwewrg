'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { api, ApiError } from '@/services/api';

export default function MessageForm({ salonId, masterId }) {
  const { user } = useAuth() || {};
  const router = useRouter();
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    setError('');
    try {
      await api('/api/messages', {
        method: 'POST',
        body: { salonId, masterId, subject: 'Вопрос по записи', body },
      });
      setSent(true);
      setBody('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не отправилось');
    }
  }

  if (sent) return <p className="text-sm">Сообщение отправлено. Ответ будет в кабинете.</p>;

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="label" htmlFor="note">Написать</label>
      <textarea id="note" required minLength={2} className="field min-h-24" value={body} onChange={(event) => setBody(event.target.value)} />
      {error ? <p className="text-sm text-lunea-accent">{error}</p> : null}
      <button className="btn btn-line" type="submit">Отправить</button>
    </form>
  );
}
