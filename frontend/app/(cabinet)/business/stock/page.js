'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { EmptyState } from '@/components/ui/States';
import { money } from '@/lib/format';

function Stock() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', unit: 'шт', price: 0, cost: 0, stock: 0, minStock: 1 });
  function load() { api('/api/business/products').then((payload) => setRows(payload.data)); }
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <form className="grid gap-3 border border-lunea-line bg-white p-4 md:grid-cols-3" onSubmit={async (event) => {
        event.preventDefault();
        await api('/api/business/products', { method: 'POST', body: { ...form, price: Number(form.price), cost: Number(form.cost), stock: Number(form.stock), minStock: Number(form.minStock) } });
        setForm({ name: '', unit: 'шт', price: 0, cost: 0, stock: 0, minStock: 1 });
        load();
      }}>
        <input className="field" required placeholder="Название" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="field" placeholder="Ед." value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
        <input className="field" type="number" placeholder="Цена" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
        <input className="field" type="number" placeholder="Себестоимость" value={form.cost} onChange={(event) => setForm({ ...form, cost: event.target.value })} />
        <input className="field" type="number" placeholder="Остаток" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />
        <button className="btn" type="submit">На склад</button>
      </form>
      {!rows.length ? <EmptyState title="Склад пуст" text="Добавьте материал или товар для продажи." /> : (
        <div className="divide-y divide-lunea-line border border-lunea-line bg-white">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p>{row.name}</p>
                <p className="text-sm text-lunea-muted">{money(row.price)} · остаток {row.stock} {row.unit}{row.stock <= row.minStock ? ' · мало' : ''}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-line h-9" onClick={async () => { await api(`/api/business/products/${row.id}/stock`, { method: 'POST', body: { qty: 1, reason: 'Приход' } }); load(); }}>+1</button>
                <button type="button" className="btn btn-line h-9" onClick={async () => { await api(`/api/business/products/${row.id}/stock`, { method: 'POST', body: { qty: -1, reason: 'Списание' } }); load(); }}>−1</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <Gate>{(space) => (space.type === 'salon' ? <Stock /> : <EmptyState title="Склад" text="Остатки ведёт кабинет." />)}</Gate>;
}
