'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bell, Menu, X } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { useAuth } from '@/components/providers/AuthProvider';
import { api } from '@/services/api';

const links = [
  { href: '/search?type=salon', label: 'Найти место' },
  { href: '/search?type=master', label: 'Мастера' },
  { href: '/search?type=service', label: 'Услуги' },
];

export default function Navbar() {
  const { user } = useAuth() || {};
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    api('/api/notifications').then((payload) => setUnread(payload.meta?.unread || 0)).catch(() => {});
  }, [user]);

  const cabinet = user?.role === 'SUPER_ADMIN'
    ? '/admin'
    : user?.role === 'SALON_OWNER' || user?.role === 'SALON_ADMIN' || user?.role === 'MASTER'
      ? '/business'
      : '/dashboard';

  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${scrolled ? 'nav-scrolled' : ''}`}>
      <div className="page flex h-[72px] items-center justify-between gap-4">
        <Link href="/" aria-label="LUNEA, на главную"><Logo /></Link>
        <nav className="hidden items-center gap-8 text-sm text-lunea-muted md:flex" aria-label="Основная">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-lunea-dark">{link.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link href="/dashboard/notifications" className="relative grid h-10 w-10 place-items-center" aria-label="Уведомления">
                <Bell size={18} strokeWidth={1.5} />
                {unread ? <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-lunea-accent" /> : null}
              </Link>
              <Link href={cabinet} className="text-sm">{user.profile?.firstName || 'Кабинет'}</Link>
            </>
          ) : <Link href="/login" className="text-sm">Войти</Link>}
          <Link href={user?.role === 'SALON_OWNER' ? '/business' : '/register?role=SALON_OWNER'} className="btn h-10 px-4 text-sm">Открыть кабинет</Link>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full md:hidden" type="button" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} onClick={() => setOpen((value) => !value)}>
          {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-lunea-line bg-lunea-bg px-5 py-4 md:hidden">
          <div className="grid gap-3 text-sm">
            {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}
            <Link href={user ? cabinet : '/login'} onClick={() => setOpen(false)}>{user ? 'Кабинет' : 'Войти'}</Link>
            <Link href="/register?role=SALON_OWNER" onClick={() => setOpen(false)}>Открыть кабинет</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
