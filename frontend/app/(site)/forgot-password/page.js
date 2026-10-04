'use client';

import { useState } from 'react';
import { api, ApiError } from '@/services/api';

export default function Page() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  async function submit(event) {
    event.preventDefault();
    try {
      const payload = await api('/api/auth/forgot-password', { method: 'POST', body: { email } });
      setMessage(payload.message);
      setLink(payload.data?.devLink || '');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Ошибка');
    }
  }
  return (
    <div className="page max-w-md pb-24 pt-32">
      <h1 className="display text-5xl">Сброс пароля</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block"><span className="label">Email</span><input className="field" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <button className="btn" type="submit">Отправить ссылку</button>
        {message ? <p className="text-sm">{message}</p> : null}
        {link ? <a className="block text-sm underline" href={link}>Ссылка для разработки</a> : null}
      </form>
    </div>
  );
}
