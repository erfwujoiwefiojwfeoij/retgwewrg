'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { EmptyState } from '@/components/ui/States';
import { money } from '@/lib/format';
import Select from '@/components/ui/Select';
import Check from '@/components/ui/Check';

function Services({ space }) {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [masters, setMasters] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  function load() {
    const salonQuery = space.salon ? `?salonId=${space.salon.id}&all=1` : '?all=1';
    api(`/api/services${salonQuery}`).then((payload) => setRows(space.salon ? payload.data : payload.data.filter((item) => item.masters.some((link) => link.masterId === space.master.id))));
    api('/api/categories').then((payload) => setCategories(payload.data));
    if (space.salon) api(`/api/masters?salonId=${space.salon.id}&pageSize=48`).then((payload) => setMasters(payload.data));
    else setMasters([space.master]);
  }
  useEffect(() => { load(); }, [space.salon?.id, space.master?.id]);

  async function save(event) {
    event.preventDefault();
    setError('');
    const body = { ...form, durationMin: Number(form.durationMin), price: Number(form.price), capacity: Number(form.capacity || 1), masterIds: form.masterIds };
    try {
      if (form.id) await api(`/api/services/${form.id}`, { method: 'PATCH', body });
      else await api('/api/services', { method: 'POST', body });
      setForm(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка');
    }
  }

  return (
    <div className="space-y-6">
      <button type="button" className="btn" onClick={() => setForm({ name: '', categoryId: categories[0]?.id || '', description: '', durationMin: 60, price: 2500, capacity: 1, masterIds: masters[0] ? [masters[0].id] : [], active: true })}>Новая услуга</button>
      {!rows.length ? <EmptyState title="Услуг нет" text="Добавьте услугу и привяжите мастеров." /> : null}
      <div className="divide-y divide-lunea-line border border-lunea-line bg-white">
        {rows.map((service) => (
          <div key={service.id} className="flex items-center justify-between px-4 py-4">
            <div>
              <p>{service.name} {!service.active ? '· скрыта' : ''}</p>
              <p className="text-sm text-lunea-muted">{service.durationMin} мин · {money(service.price)}{service.capacity > 1 ? ` · группа до ${service.capacity}` : ''}</p>
            </div>
            <button type="button" className="text-sm" onClick={() => setForm({ ...service, masterIds: service.masters.map((item) => item.masterId) })}>Изменить</button>
          </div>
        ))}
      </div>
      {form ? (
        <form onSubmit={save} className="grid gap-3 border border-lunea-line bg-white p-4">
          <label className="block"><span className="label">Название</span><input className="field" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <div>
            <label className="label" htmlFor="service-category">Категория</label>
            <Select id="service-category" className="field" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </Select>
          </div>
          <label className="block"><span className="label">Описание</span><textarea className="field min-h-20" value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="label">Минуты</span><input className="field" type="number" min="15" value={form.durationMin} onChange={(event) => setForm({ ...form, durationMin: event.target.value })} /></label>
            <label className="block"><span className="label">Цена</span><input className="field" type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
            <label className="block"><span className="label">Мест в группе</span><input className="field" type="number" min="1" max="40" value={form.capacity || 1} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /></label>
          </div>
          <div>
            <p className="label">Мастера</p>
            {masters.map((master) => (
              <label key={master.id} className="mr-4 inline-flex items-center gap-2 text-sm">
                <Check checked={form.masterIds.includes(master.id)} onChange={(event) => {
                  const next = new Set(form.masterIds);
                  if (event.target.checked) next.add(master.id); else next.delete(master.id);
                  setForm({ ...form, masterIds: [...next] });
                }} />
                {master.firstName} {master.lastName}
              </label>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 text-sm"><Check checked={form.active !== false} onChange={(event) => setForm({ ...form, active: event.target.checked })} />Активна</label>
          {error ? <p className="text-sm text-lunea-accent">{error}</p> : null}
          <button className="btn" type="submit">Сохранить</button>
        </form>
      ) : null}
    </div>
  );
}

export default function Page() {
  return <Gate>{(space) => <Services space={space} />}</Gate>;
}
