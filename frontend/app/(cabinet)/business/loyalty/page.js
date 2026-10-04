'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { EmptyState } from '@/components/ui/States';
import { money } from '@/lib/format';
import Select from '@/components/ui/Select';

function Loyalty() {
  const [certs, setCerts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [clients, setClients] = useState([]);
  const [amount, setAmount] = useState(3000);
  const [buyer, setBuyer] = useState('');
  const [plan, setPlan] = useState({ name: '5 визитов', visits: 5, price: 9000, days: 90 });
  const [sale, setSale] = useState({ planId: '', clientId: '' });
  function load() {
    api('/api/business/certificates').then((payload) => setCerts(payload.data));
    api('/api/business/abonements').then((payload) => {
      setPlans(payload.data);
      setSale((current) => ({ ...current, planId: current.planId || payload.data[0]?.id || '' }));
    });
    api('/api/business/clients').then((payload) => {
      setClients(payload.data);
      setSale((current) => ({ ...current, clientId: current.clientId || payload.data[0]?.id || '' }));
    });
  }
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-2xl">Сертификаты</h2>
        <form className="flex flex-wrap gap-2" onSubmit={async (event) => { event.preventDefault(); await api('/api/business/certificates', { method: 'POST', body: { amount: Number(amount), buyerName: buyer } }); setBuyer(''); load(); }}>
          <input className="field w-auto" type="number" min="100" value={amount} onChange={(event) => setAmount(event.target.value)} />
          <input className="field w-auto" placeholder="Кому" value={buyer} onChange={(event) => setBuyer(event.target.value)} />
          <button className="btn" type="submit">Выпустить</button>
        </form>
        <div className="divide-y divide-lunea-line border border-lunea-line bg-white">
          {certs.map((item) => <div key={item.id} className="px-4 py-3 text-sm">{item.code} · остаток {money(item.balance)} из {money(item.amount)} · {item.buyerName || 'без имени'}</div>)}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-2xl">Абонементы</h2>
        <form className="grid gap-2 md:grid-cols-4" onSubmit={async (event) => { event.preventDefault(); await api('/api/business/abonements/plans', { method: 'POST', body: { ...plan, visits: Number(plan.visits), price: Number(plan.price), days: Number(plan.days) } }); load(); }}>
          <input className="field" value={plan.name} onChange={(event) => setPlan({ ...plan, name: event.target.value })} />
          <input className="field" type="number" value={plan.visits} onChange={(event) => setPlan({ ...plan, visits: event.target.value })} />
          <input className="field" type="number" value={plan.price} onChange={(event) => setPlan({ ...plan, price: event.target.value })} />
          <button className="btn" type="submit">План</button>
        </form>
        {plans.length && clients.length ? (
          <form className="flex flex-wrap gap-2" onSubmit={async (event) => { event.preventDefault(); await api('/api/business/abonements', { method: 'POST', body: sale }); load(); }}>
            <Select className="field w-auto" value={sale.planId} onChange={(event) => setSale({ ...sale, planId: event.target.value })}>
              {plans.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
            <Select className="field w-auto" value={sale.clientId} onChange={(event) => setSale({ ...sale, clientId: event.target.value })}>
              {clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
            <button className="btn" type="submit">Продать</button>
          </form>
        ) : null}
        {plans.map((item) => (
          <div key={item.id} className="border border-lunea-line bg-white px-4 py-3 text-sm">
            <p>{item.name} · {item.visits} визитов · {money(item.price)}</p>
            {item.cards.map((card) => <p key={card.id} className="text-lunea-muted">{card.client.name}: осталось {card.visitsLeft}, номер {card.id}</p>)}
          </div>
        ))}
      </section>
      <p className="text-sm text-lunea-muted">Бонусы копятся с продаж за наличные и карту. Процент задаётся в каналах. Реферальный код есть у каждого клиента в его карточке.</p>
    </div>
  );
}

export default function Page() {
  return <Gate>{(space) => (space.type === 'salon' ? <Loyalty /> : <EmptyState title="Лояльность" text="Сертификаты выпускает кабинет." />)}</Gate>;
}
