'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { EmptyState } from '@/components/ui/States';
import { money } from '@/lib/format';
import Select from '@/components/ui/Select';

function Finance() {
  const [data, setData] = useState(null);
  const [masters, setMasters] = useState([]);
  const [entry, setEntry] = useState({ accountId: '', kind: 'EXPENSE', amount: 1000, category: 'Аренда', note: '' });
  const [scheme, setScheme] = useState({});
  function load() {
    api('/api/business/finance').then((payload) => {
      setData(payload.data);
      setEntry((current) => ({ ...current, accountId: current.accountId || payload.data.accounts[0]?.id || '' }));
    });
    api('/api/business/payroll').then((payload) => setMasters(payload.data));
  }
  useEffect(() => { load(); }, []);
  if (!data) return null;
  return (
    <div className="space-y-8">
      <p className="text-sm text-lunea-muted">Доходы {money(data.income)} · расходы {money(data.expense)} · остаток {money(data.income - data.expense)} по последним операциям</p>
      <form className="grid gap-3 border border-lunea-line bg-white p-4 md:grid-cols-2" onSubmit={async (event) => {
        event.preventDefault();
        await api('/api/business/finance', { method: 'POST', body: { ...entry, amount: Number(entry.amount) } });
        load();
      }}>
        <Select className="field" value={entry.accountId} onChange={(event) => setEntry({ ...entry, accountId: event.target.value })}>
          {data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
        </Select>
        <Select className="field" value={entry.kind} onChange={(event) => setEntry({ ...entry, kind: event.target.value })}>
          <option value="INCOME">Доход</option>
          <option value="EXPENSE">Расход</option>
        </Select>
        <input className="field" placeholder="Статья" value={entry.category} onChange={(event) => setEntry({ ...entry, category: event.target.value })} />
        <input className="field" type="number" min="1" value={entry.amount} onChange={(event) => setEntry({ ...entry, amount: event.target.value })} />
        <button className="btn" type="submit">Записать</button>
      </form>
      <div className="divide-y divide-lunea-line border border-lunea-line bg-white">
        {data.entries.map((item) => (
          <div key={item.id} className="flex justify-between px-4 py-3 text-sm">
            <span>{item.category} · {item.account.name}</span>
            <span>{item.kind === 'EXPENSE' ? '−' : '+'}{money(item.amount)}</span>
          </div>
        ))}
      </div>
      <section className="space-y-3">
        <h2 className="font-display text-2xl">Зарплата</h2>
        {masters.map((master) => {
          const current = scheme[master.id] || { percent: master.payroll?.percent ?? 40, fixed: master.payroll?.fixed ?? 0 };
          return (
            <form key={master.id} className="grid items-end gap-2 border border-lunea-line bg-white p-4 md:grid-cols-[1fr_120px_140px_auto]" onSubmit={async (event) => {
              event.preventDefault();
              await api(`/api/business/payroll/${master.id}`, { method: 'PUT', body: { percent: Number(current.percent), fixed: Number(current.fixed) } });
              const end = new Date();
              const start = new Date(end.getFullYear(), end.getMonth(), 1);
              const result = await api('/api/business/payroll/run', { method: 'POST', body: { masterId: master.id, from: start.toISOString(), to: end.toISOString() } });
              setScheme({ ...scheme, [master.id]: { ...current, last: result.data.amount } });
              load();
            }}>
              <p>{master.firstName} {master.lastName}</p>
              <label className="text-sm">Процент<input className="field" type="number" min="0" max="100" value={current.percent} onChange={(event) => setScheme({ ...scheme, [master.id]: { ...current, percent: event.target.value } })} /></label>
              <label className="text-sm">Фикс<input className="field" type="number" min="0" value={current.fixed} onChange={(event) => setScheme({ ...scheme, [master.id]: { ...current, fixed: event.target.value } })} /></label>
              <button className="btn h-11" type="submit">Начислить</button>
              {current.last != null ? <p className="text-sm md:col-span-4">К выплате {money(current.last)}</p> : null}
            </form>
          );
        })}
      </section>
    </div>
  );
}

export default function Page() {
  return <Gate>{(space) => (space.type === 'salon' ? <Finance /> : <EmptyState title="Финансы" text="Счета и зарплата ведутся в кабинете." />)}</Gate>;
}
