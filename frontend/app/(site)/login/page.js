import { LoginForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Вход' };

export default function Page() {
  return (
    <div className="page max-w-md pb-24 pt-32">
      <h1 className="display text-5xl">Вход</h1>
      <div className="mt-8"><LoginForm /></div>
    </div>
  );
}
