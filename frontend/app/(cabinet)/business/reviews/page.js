'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { EmptyState } from '@/components/ui/States';

function Reviews() {
  const [rows, setRows] = useState([]);
  const [reply, setReply] = useState('');
  function load() { api('/api/reviews?scope=business').then((payload) => setRows(payload.data)); }
  useEffect(() => { load(); }, []);
  if (!rows.length) return <EmptyState title="Отзывов нет" text="Они появятся после завершённых визитов." />;
  return (
    <div className="space-y-4">
      {rows.map((review) => (
        <article key={review.id} className="border border-lunea-line bg-white p-4">
          <p>{review.comment}</p>
          <p className="mt-2 text-sm text-lunea-muted">{review.rating}/5 · {review.author?.profile?.firstName}</p>
          {review.reply ? <p className="mt-2 text-sm">Ответ: {review.reply}</p> : (
            <form className="mt-3 flex gap-2" onSubmit={async (event) => { event.preventDefault(); await api(`/api/reviews/${review.id}/reply`, { method: 'POST', body: { reply } }); setReply(''); load(); }}>
              <input className="field" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Ответ кабинета" />
              <button className="btn" type="submit">Ответить</button>
            </form>
          )}
        </article>
      ))}
    </div>
  );
}

export default function Page() {
  return <Gate>{() => <Reviews />}</Gate>;
}
