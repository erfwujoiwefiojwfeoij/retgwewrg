'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/services/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { money, personName } from '@/lib/format';
import { ErrorState, Skeleton } from '@/components/ui/States';

const steps = ['Услуга', 'Мастер', 'Дата', 'Время', 'Контакты', 'Подтверждение'];

export default function BookingFlow({ salonSlug = '', pick = null }) {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth() || {};
  const [salon, setSalon] = useState(null);
  const [master, setMaster] = useState(null);
  const [serviceId, setServiceId] = useState(params.get('service') || '');
  const [masterId, setMasterId] = useState('');
  const [dates, setDates] = useState([]);
  const [date, setDate] = useState(params.get('date') || '');
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ clientName: '', clientPhone: '', clientEmail: '', notes: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      clientName: current.clientName || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
      clientPhone: current.clientPhone || user.profile?.phone || '',
      clientEmail: current.clientEmail || user.email || '',
    }));
  }, [user]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const salonKey = salonSlug || params.get('salon');
        const masterSlug = params.get('master');
        if (salonKey) {
          const payload = await api(`/api/salons/${salonKey}`);
          if (!ignore) setSalon(payload.data);
        }
        if (masterSlug) {
          const payload = await api(`/api/masters/${masterSlug}`);
          if (!ignore) {
            setMaster(payload.data);
            setMasterId(payload.data.id);
          }
        }
      } catch {
        if (!ignore) setError('Не удалось открыть запись');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [params, salonSlug]);

  useEffect(() => {
    if (!pick?.token) return;
    if (pick.serviceId) setServiceId(pick.serviceId);
    if (pick.masterId) setMasterId(pick.masterId);
    if (pick.serviceId && pick.masterId) setStep(2);
    else if (pick.serviceId) setStep(1);
    else setStep(0);
    setSlot(null);
  }, [pick]);

  const services = useMemo(() => {
    if (master?.services?.length) return master.services;
    return (salon?.services || []).map((service) => ({
      id: service.id,
      name: service.name,
      durationMin: service.durationMin,
      price: service.price,
    }));
  }, [salon, master]);

  const masters = useMemo(() => {
    if (master) return [master];
    const selected = salon?.services?.find((item) => item.id === serviceId);
    const linked = selected?.masters?.map((item) => item.master).filter((item) => item && !item.suspended) || salon?.masters || [];
    const unique = [];
    linked.forEach((item) => {
      if (!unique.some((row) => row.id === item.id)) unique.push(item);
    });
    return unique;
  }, [salon, master, serviceId]);

  const selectedService = services.find((item) => item.id === serviceId);
  const selectedMaster = masters.find((item) => item.id === masterId) || master;

  useEffect(() => {
    if (!masterId || !serviceId) return;
    api(`/api/availability?masterId=${masterId}&serviceId=${serviceId}`)
      .then((payload) => setDates(payload.data.dates || []))
      .catch(() => setDates([]));
  }, [masterId, serviceId]);

  useEffect(() => {
    if (!date || !masterId || !serviceId) return;
    api(`/api/availability?masterId=${masterId}&serviceId=${serviceId}&date=${date}`)
      .then((payload) => setSlots(payload.data.slots || []))
      .catch(() => setSlots([]));
  }, [date, masterId, serviceId]);

  function next() {
    setError('');
    if (step === 0 && !serviceId) return setError('Выберите услугу');
    if (step === 1 && !masterId) return setError('Выберите мастера');
    if (step === 2 && !date) return setError('Выберите дату');
    if (step === 3 && !slot) return setError('Выберите время');
    if (step === 4 && (!form.clientName || !form.clientPhone || !form.clientEmail)) return setError('Заполните контакты');
    setStep((value) => Math.min(5, value + 1));
  }

  async function confirm() {
    setSending(true);
    setError('');
    try {
      const payload = await api('/api/bookings', {
        method: 'POST',
        body: {
          masterId,
          serviceId,
          startAt: slot.startAt,
          ...form,
        },
      });
      router.push(`/book/success?id=${payload.data.publicId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось создать запись');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="space-y-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-16" />)}</div>;
  if (error && !salon && !master) return <ErrorState text={error} />;

  return (
    <div>
      <ol className="flex gap-3 overflow-x-auto text-[11px] tracking-[0.14em] text-lunea-muted">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? 'text-lunea-dark' : ''}>{String(index + 1).padStart(2, '0')} {label}</li>
        ))}
      </ol>
      <div className="mt-8">
        {step === 0 ? (
          <div className="divide-y divide-lunea-line">
            {services.map((service) => (
              <button key={service.id} type="button" onClick={() => setServiceId(service.id)} className={`flex w-full items-center justify-between py-4 text-left ${serviceId === service.id ? 'text-lunea-accent' : ''}`}>
                <span>{service.name}<span className="mt-1 block text-sm text-lunea-muted">{service.durationMin} мин</span></span>
                <span>{money(service.price)}</span>
              </button>
            ))}
            {!services.length ? <p className="text-sm text-lunea-muted">Услуг пока нет.</p> : null}
          </div>
        ) : null}
        {step === 1 ? (
          <div className="space-y-2">
            {masters.map((item) => (
              <button key={item.id} type="button" onClick={() => setMasterId(item.id)} className={`block w-full rounded-full border px-5 py-4 text-left ${masterId === item.id ? 'border-lunea-dark' : 'border-lunea-line'}`}>
                <span className="block">{personName(item)}</span>
                <span className="text-sm text-lunea-muted">{item.specialization}</span>
              </button>
            ))}
            {!masters.length ? <p className="text-sm text-lunea-muted">Нет мастеров для этой услуги.</p> : null}
          </div>
        ) : null}
        {step === 2 ? (
          <div className="flex flex-wrap gap-2">
            {dates.length ? dates.map((item) => (
              <button key={item.date} type="button" onClick={() => { setDate(item.date); setSlot(null); }} className={`min-h-16 rounded-full border px-5 py-3 text-left ${date === item.date ? 'border-lunea-dark bg-white' : 'border-lunea-line'}`}>
                <span className="block">{item.date}</span>
                <span className="text-xs text-lunea-muted">{item.count} окон</span>
              </button>
            )) : <p className="text-sm text-lunea-muted">Нет свободных дат. Проверьте расписание мастера.</p>}
          </div>
        ) : null}
        {step === 3 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((item) => (
              <button key={item.startAt} type="button" onClick={() => setSlot(item)} className={`h-12 rounded-full border ${slot?.startAt === item.startAt ? 'border-lunea-dark bg-lunea-dark text-white' : 'border-lunea-line bg-white'}`}>{item.label}</button>
            ))}
            {!slots.length ? <p className="col-span-full text-sm text-lunea-muted">В этот день окон нет.</p> : null}
          </div>
        ) : null}
        {step === 4 ? (
          <div className="grid gap-4">
            {['clientName', 'clientPhone', 'clientEmail'].map((key) => (
              <label key={key} className="block">
                <span className="label">{key === 'clientName' ? 'Имя' : key === 'clientPhone' ? 'Телефон' : 'Email'}</span>
                <input className="field" required value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
              </label>
            ))}
            <label className="block">
              <span className="label">Комментарий</span>
              <textarea className="field min-h-24" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </label>
          </div>
        ) : null}
        {step === 5 && selectedService ? (
          <div className="space-y-2 text-sm">
            <p className="font-display text-3xl">{selectedService.name}</p>
            <p>{personName(selectedMaster)}</p>
            <p>{date} · {slot?.label}</p>
            <p>{money(selectedService.price)} · {selectedService.durationMin} мин</p>
            <p>{form.clientName} · {form.clientPhone}</p>
          </div>
        ) : null}
      </div>
      {error ? <p className="mt-4 text-sm text-lunea-accent" role="alert">{error}</p> : null}
      <div className="mt-8 flex gap-3">
        {step > 0 ? <button type="button" className="btn btn-line" onClick={() => setStep((value) => value - 1)}>Назад</button> : null}
        {step < 5 ? <button type="button" className="btn" onClick={next}>Дальше</button> : <button type="button" className="btn" disabled={sending} onClick={confirm}>{sending ? 'Сохраняем' : 'Подтвердить'}</button>}
      </div>
    </div>
  );
}
