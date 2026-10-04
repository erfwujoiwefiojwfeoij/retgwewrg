'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/services/api';

function Form() {
  const params = useSearchParams();
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault();
    try {
      const payload = await api('/api/auth/verify-email', { method: 'POST', body: { token: params.get('token') } });
      setMessage(payload.message);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Ошибка');
    }
  }
  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <button className="btn" type="submit">Подтвердить email</button>
      {message ? <p className="text-sm">{message}</p> : null}
      <Link href="/login" className="block text-sm">Ко входу</Link>
    </form>
  );
}

export default function Page() {
  return (
    <div className="page max-w-md pb-24 pt-32">
      <h1 className="display text-5xl">Подтверждение</h1>
      <Suspense><Form /></Suspense>
    </div>
  );
}
