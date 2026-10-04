'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { when } from '@/lib/format';

export default function Page() {
  const [rows, setRows] = useState(null);
  const [favorites, setFavorites] = useState([]);
  useEffect(() => {
    api('/api/bookings?order=asc').then((payload) => setRows(payload.data)).catch(() => setRows([]));
    api('/api/favorites').then((payload) => setFavorites(payload.data)).catch(() => {});
  }, []);
  if (!rows) return <Skeleton className="h-48" />;
  const next = rows.find((row) => new Date(row.startAt) > new Date() && ['PENDING', 'CONFIRMED'].includes(row.status));
  const upcoming = rows.filter((row) => new Date(row.startAt) > new Date() && row.id !== next?.id).slice(0, 4);
  return (
    <div className="space-y-8">
      {next ? (
        <section className="grid gap-6 border border-lunea-line bg-white p-6 md:grid-cols-[1.4fr_auto] md:items-end">
          <div>
            <p className="eyebrow">Следующая запись</p>
            <h2 className="display mt-3 text-4xl">{next.service?.name}</h2>
            <p className="mt-3 text-sm text-lunea-muted">{when(next.startAt)}</p>
            <p className="text-sm">{next.master?.firstName} {next.master?.lastName} · {next.salon?.name || 'Частный мастер'}</p>
          </div>
          <Link href="/dashboard/appointments" className="btn">Подробнее</Link>
        </section>
      ) : <EmptyState title="Записей впереди нет" text="Выберите мастера и свободное окно." action={<Link className="btn" href="/search">Найти</Link>} />}
      <section>
        <h2 className="font-display text-2xl">Скоро</h2>
        {upcoming.length ? upcoming.map((row) => (
          <p key={row.id} className="border-b border-lunea-line py-3 text-sm">{when(row.startAt)} · {row.service?.name}</p>
        )) : <p className="mt-2 text-sm text-lunea-muted">Больше ближайших визитов нет.</p>}
      </section>
      <section>
        <h2 className="font-display text-2xl">Избранное</h2>
        <p className="mt-2 text-sm text-lunea-muted">{favorites.length ? `${favorites.length} сохранено` : 'Пока пусто'}</p>
      </section>
    </div>
  );
}
