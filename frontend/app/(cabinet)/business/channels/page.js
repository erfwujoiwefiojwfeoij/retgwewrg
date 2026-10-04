'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { EmptyState } from '@/components/ui/States';
import { when } from '@/lib/format';
import Check from '@/components/ui/Check';

const CHANNELS = [['EMAIL', 'Почта'], ['SMS', 'SMS'], ['WHATSAPP', 'WhatsApp'], ['TELEGRAM', 'Telegram'], ['MAX', 'MAX']];

function Channels() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [call, setCall] = useState({ phone: '', name: '', note: '' });
  const [copied, setCopied] = useState('');

  function load() {
    api('/api/business/channels').then((payload) => {
      setData(payload.data);
      setForm({
        yandexUrl: payload.data.desk.yandexUrl || '',
        googleUrl: payload.data.desk.googleUrl || '',
        sip: payload.data.desk.sip || '',
        bonusPercent: payload.data.desk.bonusPercent,
        referralBonus: payload.data.desk.referralBonus,
        channels: payload.data.desk.channels || [],
      });
    });
  }
  useEffect(() => { load(); }, []);
  if (!form || !data) return null;
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const book = `${origin}/widget/${data.salon.slug}`;
  const iframe = `<iframe src="${book}" title="Запись" style="width:100%;height:720px;border:0"></iframe>`;

  function toggle(channel) {
    const next = new Set(form.channels);
    if (next.has(channel)) next.delete(channel); else next.add(channel);
    setForm({ ...form, channels: [...next] });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-2xl">Ссылка и виджет</h2>
        <p className="text-sm">{book}</p>
        <div className="flex gap-2">
          <button type="button" className="btn h-9" onClick={async () => { await navigator.clipboard.writeText(book); setCopied('link'); }}>{copied === 'link' ? 'Скопировано' : 'Ссылка'}</button>
          <button type="button" className="btn btn-line h-9" onClick={async () => { await navigator.clipboard.writeText(iframe); setCopied('frame'); }}>{copied === 'frame' ? 'Скопировано' : 'Код виджета'}</button>
        </div>
        <p className="text-sm text-lunea-muted">Эту ссылку вставляют в Яндекс и Google Карты как сайт записи. Приложения клиента и сотрудника — это кабинеты: их можно установить на телефон с главного экрана.</p>
      </section>
      <form className="grid gap-3 border border-lunea-line bg-white p-4" onSubmit={async (event) => {
        event.preventDefault();
        await api('/api/business/channels', { method: 'PUT', body: { ...form, bonusPercent: Number(form.bonusPercent), referralBonus: Number(form.referralBonus) } });
        load();
      }}>
        <label className="block"><span className="label">Карточка в Яндексе</span><input className="field" value={form.yandexUrl} onChange={(event) => setForm({ ...form, yandexUrl: event.target.value })} /></label>
        <label className="block"><span className="label">Карточка в Google</span><input className="field" value={form.googleUrl} onChange={(event) => setForm({ ...form, googleUrl: event.target.value })} /></label>
        <label className="block"><span className="label">Внутренний номер</span><input className="field" value={form.sip} onChange={(event) => setForm({ ...form, sip: event.target.value })} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="label">Бонус, %</span><input className="field" type="number" min="0" max="50" value={form.bonusPercent} onChange={(event) => setForm({ ...form, bonusPercent: event.target.value })} /></label>
          <label className="block"><span className="label">Бонус за рекомендацию</span><input className="field" type="number" min="0" value={form.referralBonus} onChange={(event) => setForm({ ...form, referralBonus: event.target.value })} /></label>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {CHANNELS.map(([value, label]) => (
            <label key={value} className="inline-flex items-center gap-2"><Check checked={form.channels.includes(value)} onChange={() => toggle(value)} />{label}</label>
          ))}
        </div>
        <p className="text-sm text-lunea-muted">Почта уходит сразу. SMS, WhatsApp, Telegram и MAX встают в журнал: отметьте отправку, когда сообщение ушло из вашего канала.</p>
        <button className="btn" type="submit">Сохранить каналы</button>
      </form>
      <section className="space-y-3">
        <h2 className="font-display text-2xl">Звонки</h2>
        <form className="grid gap-2 md:grid-cols-[1fr_1fr_auto]" onSubmit={async (event) => { event.preventDefault(); await api('/api/business/calls', { method: 'POST', body: call }); setCall({ phone: '', name: '', note: '' }); load(); }}>
          <input className="field" required placeholder="Телефон" value={call.phone} onChange={(event) => setCall({ ...call, phone: event.target.value })} />
          <input className="field" placeholder="Имя и суть" value={call.note} onChange={(event) => setCall({ ...call, note: event.target.value })} />
          <button className="btn" type="submit">Записать</button>
        </form>
        {data.calls.map((item) => <p key={item.id} className="text-sm"><a href={`tel:${item.phone}`}>{item.phone}</a> · {item.note || item.name || 'звонок'} · {when(item.createdAt)}</p>)}
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-2xl">Журнал сообщений</h2>
        {data.outbox.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 border border-lunea-line bg-white px-4 py-3 text-sm">
            <div>
              <p>{item.channel} · {item.kind} · {item.status === 'SENT' ? 'отправлено' : 'в очереди'}</p>
              <p className="text-lunea-muted">{item.body}</p>
            </div>
            {item.status !== 'SENT' ? <button type="button" className="text-sm" onClick={async () => { await api(`/api/business/outbox/${item.id}/sent`, { method: 'POST' }); load(); }}>Отправлено</button> : null}
          </div>
        ))}
      </section>
    </div>
  );
}

export default function Page() {
  return <Gate>{(space) => (space.type === 'salon' ? <Channels /> : <EmptyState title="Каналы" text="Ссылку и журнал сообщений ведёт кабинет." />)}</Gate>;
}
