'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { money } from '@/lib/format';

function Analytics() {
  const [data, setData] = useState(null);
  useEffect(() => { api('/api/business/stats').then((payload) => setData(payload.data)); }, []);
  if (!data) return null;
  const max = Math.max(1, ...data.series.map((item) => item.count));
  return (
    <div>
      <p className="text-sm text-lunea-muted">Выручка месяца {money(data.revenue)} · завершено {data.completed}</p>
      <div className="mt-6 flex h-40 items-end gap-2">
        {data.series.map((item) => (
          <div key={item.date} className="flex-1">
            <div className="bg-lunea-dark" style={{ height: `${(item.count / max) * 100}%` }} />
            <p className="mt-2 text-[10px] text-lunea-muted">{item.date.slice(8)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return <Gate>{() => <Analytics />}</Gate>;
}
