'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { money, personName } from '@/lib/format';

export default function FavoritesList() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);

  function load() {
    api('/api/favorites').then((payload) => setRows(payload.data)).catch(() => setError(true));
  }
  useEffect(() => { load(); }, []);

  async function remove(row) {
    await api('/api/favorites', { method: 'POST', body: { targetType: row.targetType, targetId: row.targetId } });
    load();
  }

  if (error) return <ErrorState onRetry={load} />;
  if (!rows) return <Skeleton className="h-40" />;
  if (!rows.length) return <EmptyState title="В избранном пусто" text="Сохраняйте места, мастеров и услуги." action={<Link className="btn" href="/search">К поиску</Link>} />;

  return (
    <div className="divide-y divide-lunea-line border border-lunea-line bg-white">
      {rows.map((row) => {
        const href = row.salon ? `/salon/${row.salon.slug}` : row.master ? `/master/${row.master.slug}` : `/service/${row.service?.id}`;
        const title = row.salon?.name || (row.master ? personName(row.master) : row.service?.name);
        const meta = row.salon ? row.salon.city : row.master ? row.master.specialization : money(row.service?.price);
        return (
          <div key={row.id} className="flex items-center justify-between gap-4 px-4 py-4">
            <Link href={href}>
              <span className="text-[11px] tracking-[0.14em] text-lunea-muted">{row.targetType}</span>
              <span className="block">{title}</span>
              <span className="text-sm text-lunea-muted">{meta}</span>
            </Link>
            <button type="button" className="text-sm" onClick={() => remove(row)}>Убрать</button>
          </div>
        );
      })}
    </div>
  );
}
