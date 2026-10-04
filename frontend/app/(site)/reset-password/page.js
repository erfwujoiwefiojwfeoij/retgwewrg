'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/services/api';

function Form() {
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault();
    try {
      const payload = await api('/api/auth/reset-password', { method: 'POST', body: { token: params.get('token'), password } });
      setMessage(payload.message);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Ошибка');
    }
  }
  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block"><span className="label">Новый пароль</span><input className="field" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <button className="btn" type="submit">Сохранить</button>
      {message ? <p className="text-sm">{message}</p> : null}
      <Link href="/login" className="block text-sm">Ко входу</Link>
    </form>
  );
}

export default function Page() {
  return (
    <div className="page max-w-md pb-24 pt-32">
      <h1 className="display text-5xl">Новый пароль</h1>
      <Suspense><Form /></Suspense>
    </div>
  );
}
