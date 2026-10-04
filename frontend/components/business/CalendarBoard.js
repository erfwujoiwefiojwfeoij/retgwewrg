'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { clock, dateKey, STATUS } from '@/lib/format';
import Select from '@/components/ui/Select';

const startHour = 9;
const endHour = 21;

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date) {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export default function CalendarBoard() {
  const [view, setView] = useState('week');
  const [cursor, setCursor] = useState(new Date());
  const [masterId, setMasterId] = useState('');
  const [masters, setMasters] = useState([]);
  const [rows, setRows] = useState([]);

  const range = useMemo(() => {
    if (view === 'day') {
      const from = new Date(cursor);
      from.setHours(0, 0, 0, 0);
      return { from, to: addDays(from, 1), days: [from] };
    }
    if (view === 'month') {
      const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      const days = [];
      for (let d = new Date(from); d < to; d = addDays(d, 1)) days.push(new Date(d));
      return { from, to, days };
    }
    const from = startOfWeek(cursor);
    return { from, to: addDays(from, 7), days: Array.from({ length: 7 }, (_, index) => addDays(from, index)) };
  }, [view, cursor]);

  function load() {
    const query = new URLSearchParams({
      scope: 'business',
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    });
    if (masterId) query.set('masterId', masterId);
    api(`/api/bookings?${query.toString()}`).then((payload) => setRows(payload.data)).catch(() => setRows([]));
  }

  useEffect(() => {
    api('/api/business/workspace').then(async (payload) => {
      if (payload.data?.salon) {
        const mastersPayload = await api(`/api/masters?salonId=${payload.data.salon.id}&includeSuspended=1&pageSize=48`);
        setMasters(mastersPayload.data);
      } else if (payload.data?.master) setMasters([payload.data.master]);
    }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [range.from, range.to, masterId]);

  async function move(id, day, clientY, height) {
    const ratio = Math.min(0.98, Math.max(0, clientY / height));
    const minutes = startHour * 60 + Math.round((ratio * (endHour - startHour) * 60) / 5) * 5;
    const start = new Date(day);
    start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    const offset = start.getTimezoneOffset();
    const moscow = new Date(start.getTime() - (offset + 180) * 60000);
    await api(`/api/bookings/${id}`, { method: 'PATCH', body: { startAt: moscow.toISOString() } });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {['day', 'week', 'month'].map((item) => (
          <button key={item} type="button" className={`h-9 rounded-full px-4 text-sm ${view === item ? 'bg-lunea-dark text-white' : 'border border-lunea-line'}`} onClick={() => setView(item)}>
            {item === 'day' ? 'День' : item === 'week' ? 'Неделя' : 'Месяц'}
          </button>
        ))}
        <button type="button" className="text-sm" onClick={() => setCursor(addDays(cursor, view === 'month' ? -30 : view === 'week' ? -7 : -1))}>Назад</button>
        <button type="button" className="text-sm" onClick={() => setCursor(new Date())}>Сегодня</button>
        <button type="button" className="text-sm" onClick={() => setCursor(addDays(cursor, view === 'month' ? 30 : view === 'week' ? 7 : 1))}>Дальше</button>
        {masters.length ? (
          <Select className="field h-9 w-auto" value={masterId} onChange={(event) => setMasterId(event.target.value)}>
            <option value="">Все мастера</option>
            {masters.map((master) => <option key={master.id} value={master.id}>{master.firstName} {master.lastName}</option>)}
          </Select>
        ) : null}
      </div>
      {view === 'month' ? (
        <div className="mt-4 grid grid-cols-7 gap-px bg-lunea-line">
          {range.days.map((day) => {
            const key = dateKey(day);
            const items = rows.filter((row) => dateKey(new Date(row.startAt)) === key);
            return (
              <button key={key} type="button" className="min-h-24 bg-white p-2 text-left" onClick={() => { setCursor(day); setView('day'); }}>
                <span className="text-xs text-lunea-muted">{day.getDate()}</span>
                {items.slice(0, 3).map((row) => <span key={row.id} className="mt-1 block truncate text-[11px]">{clock(row.startAt)} {row.clientName}</span>)}
              </button>
            );
          })}
        </div>
      ) : (
        <div className={`mt-4 grid gap-px bg-lunea-line ${view === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
          {range.days.map((day) => (
            <div
              key={dateKey(day)}
              className="relative min-h-[640px] bg-white"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const id = event.dataTransfer.getData('text/plain');
                const rect = event.currentTarget.getBoundingClientRect();
                move(id, day, event.clientY - rect.top, rect.height);
              }}
            >
              <p className="border-b border-lunea-line px-2 py-2 text-xs">{dateKey(day)}</p>
              {Array.from({ length: (endHour - startHour) * 2 }, (_, index) => (
                <span key={index} className="pointer-events-none absolute left-0 right-0 border-t border-lunea-line" style={{ top: `${(index / ((endHour - startHour) * 2)) * 100}%` }} />
              ))}
              {rows.filter((row) => dateKey(new Date(row.startAt)) === dateKey(day)).map((row) => {
                const start = new Date(row.startAt);
                const mins = start.getHours() * 60 + start.getMinutes() - startHour * 60;
                const top = (mins / ((endHour - startHour) * 60)) * 100;
                const height = ((new Date(row.endAt) - start) / 60000) / ((endHour - startHour) * 60) * 100;
                return (
                  <button
                    key={row.id}
                    type="button"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData('text/plain', row.id)}
                    className="absolute left-1 right-1 overflow-hidden bg-lunea-blush px-1 text-left text-[11px]"
                    style={{ top: `${Math.max(8, top)}%`, height: `${Math.max(6, height)}%` }}
                  >
                    <span className="block">{clock(row.startAt)} {row.clientName}</span>
                    <span className="block text-lunea-muted">{row.service?.name} · {row.master?.firstName} · {STATUS[row.status]}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
