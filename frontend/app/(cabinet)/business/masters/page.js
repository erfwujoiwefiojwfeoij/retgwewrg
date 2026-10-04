'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { EmptyState } from '@/components/ui/States';
import { WEEKDAYS } from '@/lib/format';
import Select from '@/components/ui/Select';
import Check from '@/components/ui/Check';

const empty = {
  firstName: '', lastName: '', bio: '', specialization: '', experienceYears: 1,
  instagram: '', gender: 'FEMALE', photo: '', serviceIds: [],
  hours: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek, startTime: '10:00', endTime: '20:00', breakStart: '14:00', breakEnd: '15:00', isOff: dayOfWeek === 0,
  })),
};

function Masters({ space }) {
  const [rows, setRows] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [dayOff, setDayOff] = useState('');
  const [credentials, setCredentials] = useState(null);

  function load() {
    if (!space.salon) return;
    api(`/api/masters?salonId=${space.salon.id}&includeSuspended=1&pageSize=48`).then((payload) => setRows(payload.data));
    api(`/api/services?salonId=${space.salon.id}&all=1`).then((payload) => setServices(payload.data));
  }
  useEffect(() => { load(); }, [space.salon?.id]);

  async function save(event) {
    event.preventDefault();
    setError('');
    const body = { ...form, experienceYears: Number(form.experienceYears) };
    try {
      if (form.id) {
        await api(`/api/masters/${form.id}`, { method: 'PATCH', body });
      } else {
        const payload = await api('/api/masters', { method: 'POST', body });
        setCredentials(payload.credentials);
      }
      setForm(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка');
    }
  }

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append('file', file);
    const payload = await api('/api/uploads', { method: 'POST', body: data });
    setForm({ ...form, photo: payload.data.url });
  }

  async function reissue(master) {
    setError('');
    try {
      const payload = await api(`/api/masters/${master.id}/password`, { method: 'POST' });
      setCredentials(payload.data);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка');
    }
  }

  if (space.type !== 'salon') return <EmptyState title="Кабинет мастера" text="Логин и пароль выдаёт кабинет. Расписание — в календаре." />;

  return (
    <div className="space-y-6">
      <button type="button" className="btn" onClick={() => setForm({ ...empty, serviceIds: [] })}>Добавить мастера</button>
      {credentials ? (
        <div className="rounded-[28px] border border-lunea-accent bg-white p-5">
          <p className="text-sm text-lunea-muted">Передайте мастеру. Пароль показывается один раз.</p>
          <p className="mt-3">Логин <span className="font-medium">{credentials.login}</span></p>
          <p className="mt-1">Пароль <span className="font-medium">{credentials.password}</span></p>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn" onClick={() => navigator.clipboard?.writeText(`Логин: ${credentials.login}\nПароль: ${credentials.password}`)}>Скопировать</button>
            <button type="button" className="btn btn-line" onClick={() => setCredentials(null)}>Скрыть</button>
          </div>
        </div>
      ) : null}
      {!rows.length ? <EmptyState title="Мастеров нет" text="Добавьте мастера — логин и пароль сгенерируются сами." /> : null}
      <div className="divide-y divide-lunea-line border border-lunea-line bg-white">
        {rows.map((master) => (
          <div key={master.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div>
              <p>{master.firstName} {master.lastName} {master.suspended ? '· пауза' : ''}</p>
              <p className="text-sm text-lunea-muted">{master.specialization} · {master.experienceYears} лет{master.login ? ` · ${master.login}` : ''}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="text-sm" onClick={() => setForm({ firstName: master.firstName, lastName: master.lastName, bio: master.bio || '', specialization: master.specialization, experienceYears: master.experienceYears, instagram: master.instagram || '', gender: master.gender, photo: master.photo || '', id: master.id, serviceIds: master.services.map((item) => item.id), hours: empty.hours })}>Изменить</button>
              <button type="button" className="text-sm" onClick={() => reissue(master)}>Новый пароль</button>
              <button type="button" className="text-sm" onClick={async () => { await api(`/api/masters/${master.id}`, { method: 'PATCH', body: { suspended: !master.suspended } }); load(); }}>Пауза</button>
              <button type="button" className="text-sm" onClick={async () => { try { await api(`/api/masters/${master.id}`, { method: 'DELETE' }); load(); } catch (err) { setError(err.message); } }}>Удалить</button>
            </div>
          </div>
        ))}
      </div>
      {form ? (
        <form onSubmit={save} className="grid gap-3 border border-lunea-line bg-white p-4 md:grid-cols-2">
          <label className="block"><span className="label">Имя</span><input className="field" required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
          <label className="block"><span className="label">Фамилия</span><input className="field" required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
          <label className="block md:col-span-2"><span className="label">О мастере</span><textarea className="field min-h-24" value={form.bio || ''} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>
          <label className="block"><span className="label">Специализация</span><input className="field" required value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} /></label>
          <label className="block"><span className="label">Опыт, лет</span><input className="field" type="number" min="0" value={form.experienceYears} onChange={(event) => setForm({ ...form, experienceYears: event.target.value })} /></label>
          <label className="block"><span className="label">Instagram</span><input className="field" value={form.instagram || ''} onChange={(event) => setForm({ ...form, instagram: event.target.value })} /></label>
          <div>
            <label className="label" htmlFor="master-gender">Пол</label>
            <Select id="master-gender" className="field" value={form.gender || 'FEMALE'} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
              <option value="FEMALE">Женщина</option><option value="MALE">Мужчина</option><option value="ANY">Не указан</option>
            </Select>
          </div>
          <label className="block"><span className="label">Фото</span><input type="file" accept="image/*" onChange={upload} /></label>
          <div className="md:col-span-2">
            <p className="label">Услуги</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {services.map((service) => (
                <label key={service.id} className="flex items-center gap-2 text-sm">
                  <Check checked={form.serviceIds?.includes(service.id)} onChange={(event) => {
                    const next = new Set(form.serviceIds || []);
                    if (event.target.checked) next.add(service.id); else next.delete(service.id);
                    setForm({ ...form, serviceIds: [...next] });
                  }} />
                  {service.name}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <p className="label">Часы</p>
            {(form.hours || []).map((hour, index) => (
              <div key={hour.dayOfWeek} className="grid grid-cols-5 gap-2 text-sm">
                <span>{WEEKDAYS[hour.dayOfWeek]}</span>
                <input className="field h-9" value={hour.startTime} onChange={(event) => { const hours = [...form.hours]; hours[index] = { ...hour, startTime: event.target.value }; setForm({ ...form, hours }); }} />
                <input className="field h-9" value={hour.endTime} onChange={(event) => { const hours = [...form.hours]; hours[index] = { ...hour, endTime: event.target.value }; setForm({ ...form, hours }); }} />
                <input className="field h-9" value={hour.breakStart || ''} onChange={(event) => { const hours = [...form.hours]; hours[index] = { ...hour, breakStart: event.target.value }; setForm({ ...form, hours }); }} />
                <label className="flex items-center gap-2"><Check checked={hour.isOff} onChange={(event) => { const hours = [...form.hours]; hours[index] = { ...hour, isOff: event.target.checked }; setForm({ ...form, hours }); }} />выходной</label>
              </div>
            ))}
          </div>
          {form.id ? (
            <div className="md:col-span-2 flex gap-2">
              <input className="field" type="date" value={dayOff} onChange={(event) => setDayOff(event.target.value)} />
              <button type="button" className="btn btn-line" onClick={async () => { await api(`/api/masters/${form.id}/days-off`, { method: 'POST', body: { date: dayOff, reason: 'Выходной' } }); setDayOff(''); }}>День отпуска</button>
            </div>
          ) : null}
          {error ? <p className="text-sm text-lunea-accent md:col-span-2">{error}</p> : null}
          <button className="btn" type="submit">Сохранить</button>
        </form>
      ) : null}
    </div>
  );
}

export default function Page() {
  return <Gate>{(space) => <Masters space={space} />}</Gate>;
}
