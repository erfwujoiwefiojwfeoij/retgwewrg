'use client';

import Cabinet from '@/layouts/Cabinet';
import { useAuth } from '@/components/providers/AuthProvider';

const items = [
  { href: '/admin', label: 'Сводка', short: 'Сводка' },
  { href: '/admin/users', label: 'Пользователи', short: 'Люди' },
  { href: '/admin/salons', label: 'Кабинеты', short: 'Места' },
  { href: '/admin/masters', label: 'Мастера', short: 'Мастера' },
  { href: '/admin/bookings', label: 'Записи', short: 'Записи' },
  { href: '/admin/reviews', label: 'Отзывы', short: 'Отзывы' },
  { href: '/admin/reports', label: 'Отчёты', short: 'Отчёты' },
  { href: '/admin/categories', label: 'Категории', short: 'Катег.' },
  { href: '/admin/settings', label: 'Настройки', short: 'Ещё' },
];

export default function Layout({ children }) {
  const { user, ready } = useAuth() || {};
  if (ready && user && user.role !== 'SUPER_ADMIN') {
    return <div className="grid min-h-screen place-items-center">Недостаточно прав</div>;
  }
  return <Cabinet title="Админ" items={items}>{children}</Cabinet>;
}
