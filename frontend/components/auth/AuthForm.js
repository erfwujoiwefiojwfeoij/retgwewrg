'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/services/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { FieldError } from '@/components/ui/States';
import Select from '@/components/ui/Select';

export function LoginForm() {
  const router = useRouter();
  const { refresh } = useAuth() || {};
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const payload = await api('/api/auth/login', { method: 'POST', body: form });
      await refresh?.();
      const role = payload.data.role;
      router.push(role === 'SUPER_ADMIN' ? '/admin' : role === 'CLIENT' ? '/dashboard' : '/business');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block"><span className="label">Email или логин</span><input className="field" autoComplete="username" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
      <label className="block"><span className="label">Пароль</span><input className="field" type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
      {error ? <p className="text-sm text-lunea-accent">{error}</p> : null}
      <button className="btn w-full" disabled={pending} type="submit">{pending ? 'Входим' : 'Войти'}</button>
      <div className="flex justify-between text-sm">
        <Link href="/register">Регистрация</Link>
        <Link href="/forgot-password">Забыли пароль</Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const params = useSearchParams();
  const [form, setForm] = useState({
    role: params.get('role') === 'SALON_OWNER' ? 'SALON_OWNER' : 'CLIENT',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    city: 'Москва',
  });
  const [fields, setFields] = useState({});
  const [message, setMessage] = useState('');
  const [devLink, setDevLink] = useState('');
  const [pending, setPending] = useState(false);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setFields({});
    setMessage('');
    try {
      const payload = await api('/api/auth/register', { method: 'POST', body: form });
      setMessage(payload.message);
      setDevLink(payload.data?.devLink || '');
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields || {});
        setMessage(err.message);
      }
    } finally {
      setPending(false);
    }
  }

  if (message && !Object.keys(fields).length) {
    return (
      <div>
        <p>{message}</p>
        {devLink ? <a className="mt-4 block text-sm underline" href={devLink}>Открыть письмо в режиме разработки</a> : null}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 overflow-hidden rounded-full border border-lunea-line text-sm">
        {[['CLIENT', 'Клиент'], ['SALON_OWNER', 'Кабинет']].map(([role, label]) => (
          <button key={role} type="button" className={`h-11 ${form.role === role ? 'bg-lunea-dark text-white' : ''}`} onClick={() => set('role', role)}>{label}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block"><span className="label">Имя</span><input className="field" required value={form.firstName} onChange={(event) => set('firstName', event.target.value)} /><FieldError>{fields.firstName}</FieldError></label>
        <label className="block"><span className="label">Фамилия</span><input className="field" required value={form.lastName} onChange={(event) => set('lastName', event.target.value)} /><FieldError>{fields.lastName}</FieldError></label>
      </div>
      <label className="block"><span className="label">Email</span><input className="field" type="email" required value={form.email} onChange={(event) => set('email', event.target.value)} /><FieldError>{fields.email}</FieldError></label>
      <label className="block"><span className="label">Пароль</span><input className="field" type="password" minLength={8} required value={form.password} onChange={(event) => set('password', event.target.value)} /><FieldError>{fields.password}</FieldError></label>
      <label className="block"><span className="label">Телефон</span><input className="field" value={form.phone} onChange={(event) => set('phone', event.target.value)} /></label>
      <div>
        <label className="label" htmlFor="city">Город</label>
        <Select id="city" className="field" value={form.city} onChange={(event) => set('city', event.target.value)}>
          <option>Москва</option><option>Санкт-Петербург</option><option>Казань</option>
        </Select>
      </div>
      {message ? <p className="text-sm text-lunea-accent">{message}</p> : null}
      <button className="btn w-full" disabled={pending} type="submit">{pending ? 'Создаём' : 'Создать аккаунт'}</button>
      <Link href="/login" className="block text-sm">Уже есть аккаунт</Link>
    </form>
  );
}
