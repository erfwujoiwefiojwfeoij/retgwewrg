'use client';

import Cabinet from '@/layouts/Cabinet';

const items = [
  { href: '/dashboard', label: 'Обзор', short: 'Обзор' },
  { href: '/dashboard/appointments', label: 'Мои записи', short: 'Записи' },
  { href: '/dashboard/favorites', label: 'Избранное', short: 'Избр.' },
  { href: '/dashboard/messages', label: 'Сообщения', short: 'Чат' },
  { href: '/dashboard/profile', label: 'Профиль', short: 'Профиль' },
  { href: '/dashboard/settings', label: 'Настройки', short: 'Ещё' },
];

export default function Layout({ children }) {
  return <Cabinet title="Кабинет" items={items}>{children}</Cabinet>;
}
