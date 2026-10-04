'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { when } from '@/lib/format';

export default function Page() {
  const [rows, setRows] = useState(null);
  function load() { api('/api/notifications').then((payload) => setRows(payload.data)); }
  useEffect(() => { load(); }, []);
  async function readAll() {
    await api('/api/notifications/read', { method: 'POST', body: {} });
    load();
  }
  if (!rows) return <Skeleton className="h-40" />;
  if (!rows.length) return <EmptyState title="Уведомлений нет" text="Здесь появятся записи, отмены и просьбы об отзыве." />;
  return (
    <div>
      <button type="button" className="mb-4 text-sm" onClick={readAll}>Отметить прочитанными</button>
      <div className="divide-y divide-lunea-line border border-lunea-line bg-white">
        {rows.map((row) => (
          <Link key={row.id} href={row.link || '/dashboard'} className={`block px-4 py-4 ${row.read ? 'text-lunea-muted' : ''}`}>
            <span className="block">{row.title}</span>
            <span className="text-sm">{row.body}</span>
            <span className="mt-1 block text-xs">{when(row.createdAt)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
