'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { EmptyState } from '@/components/ui/States';
import { money, when } from '@/lib/format';
import Select from '@/components/ui/Select';
import Check from '@/components/ui/Check';

const SOURCES = ['Сайт', 'Instagram', 'Карты', 'Рекомендация', 'Витрина', 'Другое'];

function Clients() {
  const [q, setQ] = useState('');
  const [segment, setSegment] = useState('все');
  const [rows, setRows] = useState([]);
  const [rate, setRate] = useState(0);
  const [notes, setNotes] = useState({});
  const [riders, setRiders] = useState([]);
  const [notice, setNotice] = useState('');
  const [formula, setFormula] = useState({});
  const [deposit, setDeposit] = useState({});
  function load(value = q) {
    api(`/api/business/clients?q=${encodeURIComponent(value)}`).then((payload) => {
      setRows(payload.data);
      setRate(payload.meta?.returnRate || 0);
    }).catch(() => setRows([]));
  }
  useEffect(() => {
    load('');
    api('/api/business/riders').then((payload) => setRiders(payload.data)).catch(() => setRiders([]));
  }, []);
  const visible = segment === 'все' ? rows : rows.filter((client) => client.segment === segment);
  async function ask(client, kind) {
    setNotice('');
    try {
      await api('/api/business/outreach', {
        method: 'POST',
        body: { clientId: client.id, kind, channel: 'EMAIL', riderSlug: riders[0]?.slug || '' },
      });
      setNotice('Сообщение поставлено в журнал.');
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Не отправилось');
    }
  }
  return (
    <div>
      <p className="mb-4 text-sm text-lunea-muted">Возвращаемость {rate}% — доля клиентов с двумя и более визитами.</p>
      {notice ? <p className="mb-4 text-sm">{notice}</p> : null}
      <form className="mb-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); load(); }}>
        <input className="field" placeholder="Имя, телефон или email" value={q} onChange={(event) => setQ(event.target.value)} />
        <button className="btn" type="submit">Найти</button>
      </form>
      <div className="mb-4 flex flex-wrap gap-2">
        {['все', 'новый', 'возвращается', 'постоянный', 'спит', 'записан'].map((item) => (
          <button key={item} type="button" className={`h-9 rounded-full px-4 text-sm ${segment === item ? 'bg-lunea-accent text-white' : 'border border-lunea-line'}`} onClick={() => setSegment(item)}>{item}</button>
        ))}
      </div>
      {!visible.length ? <EmptyState title="Клиентов нет" text="Они появятся после первой записи." /> : (
        <div className="grid gap-3">
          {visible.map((client) => (
            <article key={client.id} className="border border-lunea-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p>{client.name} <span className="text-sm text-lunea-muted">{client.segment}</span></p>
                  <p className="text-sm text-lunea-muted">{client.phone} · {client.email}</p>
                  <p className="text-sm">{client.totalVisits} визитов · {money(client.totalSpent)} · бонусы {client.bonusBalance} · депозит {money(client.deposit || 0)}{client.referralCode ? ` · код ${client.referralCode}` : ''}</p>
                  {client.returnWeeks && client.lastVisit && (Date.now() - new Date(client.lastVisit)) / 86400000 >= client.returnWeeks * 7 ? <p className="text-sm text-lunea-accent">Пора пригласить: прошло больше {client.returnWeeks} нед.</p> : null}
                  <p className="text-sm text-lunea-muted">{client.lastVisit ? `последний ${when(client.lastVisit)}` : 'визитов ещё не было'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="text-sm" onClick={() => ask(client, 'review')}>Попросить отзыв</button>
                  <button type="button" className="text-sm" onClick={() => ask(client, 'return')}>Позвать снова</button>
                  {riders[0] ? <button type="button" className="text-sm" onClick={() => ask(client, 'rider')}>Ссылка на райдер</button> : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center gap-2"><Check checked={client.consentData} onChange={async (event) => { await api(`/api/business/clients/${client.id}`, { method: 'PATCH', body: { consentData: event.target.checked } }); load(); }} />Согласие на данные</label>
                <label className="inline-flex items-center gap-2"><Check checked={client.consentAds} onChange={async (event) => { await api(`/api/business/clients/${client.id}`, { method: 'PATCH', body: { consentAds: event.target.checked } }); load(); }} />Согласие на рассылку</label>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[180px_120px_auto]">
                <Select className="field" value={client.source || ''} onChange={async (event) => { await api(`/api/business/clients/${client.id}`, { method: 'PATCH', body: { source: event.target.value } }); load(); }}>
                  <option value="">Откуда пришёл</option>
                  {SOURCES.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <input className="field" type="number" min="1" max="52" placeholder="Недель до повтора" defaultValue={client.returnWeeks || ''} onBlur={async (event) => {
                  const value = event.target.value ? Number(event.target.value) : null;
                  await api(`/api/business/clients/${client.id}`, { method: 'PATCH', body: { returnWeeks: value } });
                  load();
                }} />
                <form className="flex gap-2" onSubmit={async (event) => { event.preventDefault(); await api(`/api/business/clients/${client.id}/deposit`, { method: 'POST', body: { amount: Number(deposit[client.id] || 0) } }); setDeposit({ ...deposit, [client.id]: '' }); load(); }}>
                  <input className="field" type="number" min="100" placeholder="Пополнить депозит" value={deposit[client.id] || ''} onChange={(event) => setDeposit({ ...deposit, [client.id]: event.target.value })} />
                  <button className="text-sm" type="submit">Внести</button>
                </form>
              </div>
              <div className="mt-4 border-t border-lunea-line pt-3">
                <p className="text-sm text-lunea-muted">Формула визита</p>
                {(client.formulas || []).map((item) => (
                  <p key={item.id} className="mt-2 text-sm"><span className="text-lunea-muted">{item.title}.</span> {item.body}</p>
                ))}
                <form className="mt-2 grid gap-2 md:grid-cols-[180px_1fr_auto]" onSubmit={async (event) => {
                  event.preventDefault();
                  const draft = formula[client.id] || { title: '', body: '' };
                  await api(`/api/business/clients/${client.id}/formulas`, { method: 'POST', body: draft });
                  setFormula({ ...formula, [client.id]: { title: '', body: '' } });
                  load();
                }}>
                  <input className="field" required placeholder="Окрашивание" value={formula[client.id]?.title || ''} onChange={(event) => setFormula({ ...formula, [client.id]: { ...formula[client.id], title: event.target.value, body: formula[client.id]?.body || '' } })} />
                  <input className="field" required placeholder="7.1, оксид 3%, 35 минут" value={formula[client.id]?.body || ''} onChange={(event) => setFormula({ ...formula, [client.id]: { title: formula[client.id]?.title || '', body: event.target.value } })} />
                  <button className="text-sm" type="submit">Записать</button>
                </form>
              </div>
              <form className="mt-3 flex gap-2" onSubmit={async (event) => { event.preventDefault(); await api(`/api/business/clients/${client.id}`, { method: 'PATCH', body: { notes: notes[client.id] ?? client.notes ?? '' } }); load(); }}>
                <input className="field h-9" defaultValue={client.notes || ''} placeholder="Заметка" onChange={(event) => setNotes({ ...notes, [client.id]: event.target.value })} />
                <button className="text-sm" type="submit">Ок</button>
              </form>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(client.photos || []).map((photo) => <img key={photo.id} src={photo.url} alt={photo.caption || 'Фото визита'} className="h-16 w-16 object-cover" />)}
                <label className="text-sm">
                  Фото до и после
                  <input className="mt-1 block text-xs" type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const body = new FormData();
                    body.append('file', file);
                    const uploaded = await api('/api/uploads', { method: 'POST', body });
                    await api(`/api/business/clients/${client.id}/photos`, { method: 'POST', body: { url: uploaded.data.url, caption: 'До и после' } });
                    load();
                  }} />
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <Gate>{(space) => (space.type === 'salon' ? <Clients /> : <EmptyState title="Клиенты" text="Список ведётся в кабинете." />)}</Gate>;
}
