import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Регистрация' };

export default function Page() {
  return (
    <div className="page max-w-lg pb-24 pt-32">
      <h1 className="display text-5xl">Регистрация</h1>
      <div className="mt-8"><Suspense><RegisterForm /></Suspense></div>
    </div>
  );
}
