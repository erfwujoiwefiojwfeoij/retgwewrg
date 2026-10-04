'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { STATUS, money, when } from '@/lib/format';
import Select from '@/components/ui/Select';

export default function Appointments({ scope }) {
  const params = useSearchParams();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);
  const [reviewFor, setReviewFor] = useState(params.get('review') || '');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [reply, setReply] = useState('');

  function load() {
    const query = scope ? '?scope=business&order=desc' : '?order=desc';
    api(`/api/bookings${query}`).then((payload) => setRows(payload.data)).catch(() => setError(true));
  }

  useEffect(() => { load(); }, [scope]);

  async function patch(id, body) {
    await api(`/api/bookings/${id}`, { method: 'PATCH', body });
    load();
  }

  async function sendReview(event) {
    event.preventDefault();
    await api('/api/reviews', { method: 'POST', body: { bookingId: reviewFor, rating, comment } });
    setReviewFor('');
    load();
  }

  async function sendReply(id) {
    await api(`/api/reviews/${id}/reply`, { method: 'POST', body: { reply } });
    setReply('');
    load();
  }

  if (error) return <ErrorState onRetry={load} />;
  if (!rows) return <Skeleton className="h-40" />;
  if (!rows.length) return <EmptyState title="Записей нет" text="Когда появится визит, он будет здесь." action={<Link href="/search" className="btn">Найти мастера</Link>} />;

  const now = Date.now();
  const upcoming = rows.filter((row) => new Date(row.startAt).getTime() >= now && !['CANCELLED', 'NO_SHOW'].includes(row.status));
  const history = rows.filter((row) => !upcoming.includes(row));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-2xl">Ближайшие</h2>
        <List rows={upcoming.length ? upcoming : []} empty="Нет предстоящих визитов" patch={patch} scope={scope} onReview={setReviewFor} />
      </section>
      <section>
        <h2 className="font-display text-2xl">История</h2>
        <List rows={history} empty="История пуста" patch={patch} scope={scope} onReview={setReviewFor} onReply={sendReply} reply={reply} setReply={setReply} />
      </section>
      {reviewFor ? (
        <form onSubmit={sendReview} className="border border-lunea-line bg-white p-4">
          <p className="label">Отзыв</p>
          <Select className="field" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
          <textarea className="field mt-3 min-h-24" required value={comment} onChange={(event) => setComment(event.target.value)} />
          <button className="btn mt-3" type="submit">Отправить</button>
        </form>
      ) : null}
    </div>
  );
}

function List({ rows, empty, patch, scope, onReview, onReply, reply, setReply }) {
  if (!rows.length) return <p className="mt-3 text-sm text-lunea-muted">{empty}</p>;
  return (
    <div className="mt-3 divide-y divide-lunea-line border border-lunea-line bg-white">
      {rows.map((row) => (
        <article key={row.id} className="grid gap-2 px-4 py-4 md:grid-cols-[1.4fr_auto]">
          <div>
            <p>{row.service?.name}</p>
            <p className="text-sm text-lunea-muted">{when(row.startAt)} · {row.master?.firstName} {row.master?.lastName} · {row.salon?.name || 'Частный мастер'}</p>
            <p className="text-sm">{STATUS[row.status]} · {row.publicId}</p>
            {scope ? <p className="text-sm">{row.clientName} · {row.clientPhone}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {!scope && ['PENDING', 'CONFIRMED'].includes(row.status) ? <button className="btn btn-line h-9" type="button" onClick={() => patch(row.id, { status: 'CANCELLED' })}>Отменить</button> : null}
            {scope && row.status === 'PENDING' ? <button className="btn h-9" type="button" onClick={() => patch(row.id, { status: 'CONFIRMED' })}>Подтвердить</button> : null}
            {scope && ['PENDING', 'CONFIRMED'].includes(row.status) ? <button className="btn btn-line h-9" type="button" onClick={() => patch(row.id, { prepaid: row.prepaid ? 0 : row.price })}>{row.prepaid ? `Предоплата ${money(row.prepaid)}` : 'Предоплата'}</button> : null}
            {scope && row.status === 'CONFIRMED' ? <button className="btn btn-line h-9" type="button" onClick={() => patch(row.id, { status: 'COMPLETED' })}>Завершить</button> : null}
            {scope && row.status === 'CONFIRMED' ? <button className="btn btn-line h-9" type="button" onClick={() => patch(row.id, { status: 'NO_SHOW' })}>Не пришёл</button> : null}
            {!scope && row.status === 'COMPLETED' && !row.review ? <button className="btn h-9" type="button" onClick={() => onReview(row.id)}>Отзыв</button> : null}
            {scope && row.review && !row.review.reply ? (
              <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); onReply(row.review.id); }}>
                <input className="field h-9" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Ответ" />
                <button className="btn h-9" type="submit">Ответить</button>
              </form>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
