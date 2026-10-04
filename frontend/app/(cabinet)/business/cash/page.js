'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { EmptyState } from '@/components/ui/States';
import { money } from '@/lib/format';
import Select from '@/components/ui/Select';

const METHODS = [['CASH', 'Наличные'], ['CARD', 'Карта'], ['TRANSFER', 'Перевод'], ['DEPOSIT', 'Депозит'], ['CERTIFICATE', 'Сертификат'], ['ABONEMENT', 'Абонемент'], ['BONUS', 'Бонусы']];

function Cash() {
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ title: '', qty: 1, price: 0, productId: '', method: 'CASH', tip: 0, clientId: '', certificateCode: '', abonementId: '' });
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  function load() {
    api('/api/business/sales').then((payload) => setSales(payload.data));
    api('/api/business/clients').then((payload) => setClients(payload.data));
    api('/api/business/products').then((payload) => setProducts(payload.data)).catch(() => setProducts([]));
  }
  useEffect(() => { load(); }, []);

  async function sell(event) {
    event.preventDefault();
    setError('');
    try {
      const payload = await api('/api/business/sales', {
        method: 'POST',
        body: {
          clientId: form.clientId || null,
          method: form.method,
          tip: Number(form.tip) || 0,
          certificateCode: form.certificateCode,
          abonementId: form.abonementId || null,
          lines: [{ title: form.title, qty: Number(form.qty), price: Number(form.price), productId: form.productId || null }],
        },
      });
      setReceipt(payload.data);
      setForm({ ...form, title: '', price: 0 });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Продажа не прошла');
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={sell} className="grid gap-3 border border-lunea-line bg-white p-4">
        <div>
          <label className="label" htmlFor="sale-product">Товар со склада</label>
          <Select id="sale-product" className="field" value={form.productId} onChange={(event) => {
            const product = products.find((item) => item.id === event.target.value);
            setForm({ ...form, productId: event.target.value, title: product?.name || form.title, price: product?.price ?? form.price });
          }}>
            <option value="">Услуга или своя позиция</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name} · остаток {product.stock}</option>)}
          </Select>
        </div>
        <label className="block"><span className="label">Позиция</span><input className="field" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="label">Количество</span><input className="field" type="number" min="1" value={form.qty} onChange={(event) => setForm({ ...form, qty: event.target.value })} /></label>
          <label className="block"><span className="label">Цена</span><input className="field" type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
        </div>
        <div>
          <label className="label" htmlFor="sale-method">Оплата</label>
          <Select id="sale-method" className="field" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>
            {METHODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </div>
        <label className="block"><span className="label">Чаевые</span><input className="field" type="number" min="0" value={form.tip} onChange={(event) => setForm({ ...form, tip: event.target.value })} /></label>
        <div>
          <label className="label" htmlFor="sale-client">Клиент</label>
          <Select id="sale-client" className="field" value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
            <option value="">Без карты клиента</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </Select>
        </div>
        {form.method === 'CERTIFICATE' ? <input className="field" placeholder="Код сертификата" value={form.certificateCode} onChange={(event) => setForm({ ...form, certificateCode: event.target.value })} /> : null}
        {form.method === 'ABONEMENT' ? <input className="field" placeholder="Номер абонемента" value={form.abonementId} onChange={(event) => setForm({ ...form, abonementId: event.target.value })} /> : null}
        {error ? <p className="text-sm text-lunea-accent">{error}</p> : null}
        <button className="btn" type="submit">Пробить</button>
      </form>
      {receipt ? <p className="text-sm">Чек {receipt.receipt}: {money(receipt.total)} и чаевые {money(receipt.tip)}. Это внутренний чек кабинета, без фискального оператора.</p> : null}
      <div className="divide-y divide-lunea-line border border-lunea-line bg-white">
        {sales.map((sale) => (
          <div key={sale.id} className="px-4 py-3 text-sm">
            <p>{sale.receipt} · {money(sale.total)} · чаевые {money(sale.tip)}</p>
            <p className="text-lunea-muted">{sale.lines.map((line) => line.title).join(', ')} · {sale.client?.name || 'без клиента'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return <Gate>{(space) => (space.type === 'salon' ? <Cash /> : <EmptyState title="Касса" text="Продажи ведёт кабинет." />)}</Gate>;
}
