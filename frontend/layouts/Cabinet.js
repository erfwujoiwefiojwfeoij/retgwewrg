'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { api } from '@/services/api';
import Logo from '@/components/brand/Logo';
import PageEnter from '@/components/motion/PageEnter';

export default function Cabinet({ title, items, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, setUser } = useAuth() || {};

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    setUser?.(null);
    router.push('/');
  }

  if (ready && !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <p className="display text-4xl">Нужен вход</p>
          <Link href="/login" className="btn mt-6">Войти</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-lunea-line bg-white md:sticky md:top-0 md:flex md:h-screen md:flex-col md:overflow-y-auto">
        <Link href="/" className="px-6 py-6"><Logo /></Link>
        <nav className="grid gap-1 px-3 pb-6" aria-label={title}>
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-sm ${active ? 'bg-lunea-blush' : ''}`}>
                {Icon ? <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-lunea-accent' : 'text-lunea-muted'}`} strokeWidth={1.75} /> : null}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button type="button" className="mt-auto flex items-center gap-2.5 px-6 py-6 text-left text-sm text-lunea-muted" onClick={logout}>
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
          Выйти
        </button>
      </aside>
      <div>
        <header className="flex items-center justify-between border-b border-lunea-line px-5 py-4">
          <h1 className="font-display text-2xl">{title}</h1>
          <Link href="/" className="text-sm md:hidden">На сайт</Link>
        </header>
        <div className="px-5 py-6 pb-24"><PageEnter>{children}</PageEnter></div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-flow-col border-t border-lunea-line bg-white md:hidden" aria-label="Мобильная навигация">
        {(() => {
          const more = items.find((item) => item.short === 'Ещё');
          const head = items.filter((item) => item !== more).slice(0, more ? 4 : 5);
          return more ? [...head, more] : head;
        })().map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 px-2 py-2 text-center text-[11px] ${active ? 'text-lunea-accent' : ''}`}>
              {Icon ? <Icon className="h-4 w-4" strokeWidth={1.75} /> : null}
              {item.short || item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
