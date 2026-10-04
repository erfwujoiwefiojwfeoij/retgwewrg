'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { Skeleton } from '@/components/ui/States';
import { money, when } from '@/lib/format';

function Board() {
  const [data, setData] = useState(null);
  useEffect(() => { api('/api/business/stats').then((payload) => setData(payload.data)); }, []);
  if (!data) return <Skeleton className="h-64" />;
  const max = Math.max(1, ...data.series.map((item) => item.revenue));
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ['Сегодня', data.today.length],
          ['Выручка', money(data.revenue)],
          ['Новые клиенты', data.newClients],
          ['Загрузка', `${data.occupancy}%`],
        ].map(([label, value]) => (
          <div key={label} className="border border-lunea-line bg-white p-4">
            <p className="text-xs text-lunea-muted">{label}</p>
            <p className="font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="border border-lunea-line bg-white p-4">
          <h2 className="text-sm text-lunea-muted">Ближайшие</h2>
          {data.upcoming.map((row) => <p key={row.id} className="border-b border-lunea-line py-3 text-sm">{when(row.startAt)} · {row.clientName} · {row.service?.name}</p>)}
          {!data.upcoming.length ? <p className="py-4 text-sm text-lunea-muted">Пока пусто</p> : null}
        </section>
        <section className="border border-lunea-line bg-white p-4">
          <h2 className="text-sm text-lunea-muted">14 дней</h2>
          <div className="mt-4 flex h-28 items-end gap-1">
            {data.series.map((item) => <span key={item.date} title={item.date} className="flex-1 bg-lunea-pink" style={{ height: `${Math.max(6, (item.revenue / max) * 100)}%` }} />)}
          </div>
          <p className="mt-4 text-sm">Мастеров: {data.masters} · услуг: {data.services}</p>
          <p className="text-sm text-lunea-muted">Тариф: {data.workspace.salon?.subscription?.status || 'личный кабинет мастера'}</p>
        </section>
      </div>
    </div>
  );
}

export default function Page() {
  return <Gate>{() => <Board />}</Gate>;
}
