'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchIsland from '@/components/search/SearchIsland';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import Select from '@/components/ui/Select';
import Check from '@/components/ui/Check';
import { api } from '@/services/api';
import { money, personName } from '@/lib/format';

const sorts = [
  ['recommended', 'Рекомендуем'],
  ['rating', 'Рейтинг'],
  ['price', 'Цена'],
  ['nearest', 'Ближе'],
  ['today', 'Сегодня'],
];

export default function SearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const query = Object.fromEntries(params.entries());

  function update(patch) {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    router.push(`/search?${next.toString()}`);
  }

  useEffect(() => {
    setLoading(true);
    setError(false);
    const search = params.toString();
    api(`/api/search?${search}`)
      .then((data) => setPayload(data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params]);

  const data = payload || { salons: [], masters: [], services: [], meta: {} };
  const type = query.type || 'all';
  const total = (data.meta.salons || 0) + (data.meta.masters || 0) + (data.meta.services || 0);

  return (
    <div className="page pb-20 pt-28">
      <SearchIsland initialQuery={query.q || ''} initialCity={query.city || 'Москва'} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <label className="label" htmlFor="type">Что ищем</label>
          <Select id="type" className="field" value={type} onChange={(event) => update({ type: event.target.value })}>
            <option value="all">Всё</option>
            <option value="salon">Места</option>
            <option value="master">Мастера</option>
            <option value="service">Услуги</option>
          </Select>
          <label className="label" htmlFor="city">Город</label>
          <Select id="city" className="field" value={query.city || ''} onChange={(event) => update({ city: event.target.value })}>
            <option value="">Все города</option>
            <option>Москва</option>
            <option>Санкт-Петербург</option>
            <option>Казань</option>
          </Select>
          <label className="label" htmlFor="distance">Расстояние, км</label>
          <Select id="distance" className="field" value={query.distance || ''} onChange={(event) => update({ distance: event.target.value })}>
            <option value="">Любое</option>
            <option value="2">до 2</option>
            <option value="5">до 5</option>
            <option value="15">до 15</option>
          </Select>
          <label className="label" htmlFor="price">Цена до</label>
          <input id="price" className="field" inputMode="numeric" value={query.price || ''} onChange={(event) => update({ price: event.target.value })} placeholder="5000" />
          <label className="label" htmlFor="rating">Рейтинг от</label>
          <Select id="rating" className="field" value={query.rating || ''} onChange={(event) => update({ rating: event.target.value })}>
            <option value="">Любой</option>
            <option value="4">4+</option>
            <option value="4.5">4.5+</option>
          </Select>
          <label className="label" htmlFor="service">Услуга</label>
          <input id="service" className="field" value={query.service || ''} onChange={(event) => update({ service: event.target.value })} placeholder="nails или маникюр" />
          <label className="label" htmlFor="gender">Пол мастера</label>
          <Select id="gender" className="field" value={query.gender || ''} onChange={(event) => update({ gender: event.target.value })}>
            <option value="">Не важно</option>
            <option value="FEMALE">Женщина</option>
            <option value="MALE">Мужчина</option>
          </Select>
          <label className="label" htmlFor="experience">Опыт от, лет</label>
          <input id="experience" className="field" inputMode="numeric" value={query.experience || ''} onChange={(event) => update({ experience: event.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <Check checked={query.availability === 'today'} onChange={(event) => update({ availability: event.target.checked ? 'today' : '' })} />
            Есть окно сегодня
          </label>
        </aside>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-lunea-muted">{loading ? 'Ищем' : `${total} результатов`}</p>
            <div className="text-sm">
              <span className="sr-only">Сортировка</span>
              <Select className="field w-auto" value={query.sort || 'recommended'} onChange={(event) => update({ sort: event.target.value })}>
                {sorts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
            </div>
          </div>
          {loading ? <div className="mt-6 space-y-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-28" />)}</div> : null}
          {error ? <div className="mt-6"><ErrorState onRetry={() => update({})} /></div> : null}
          {!loading && !error && total === 0 ? <div className="mt-6"><EmptyState title="Ничего не нашлось" text="Измените город, цену или запрос." /></div> : null}
          <div className="mt-6 space-y-4">
            {(type === 'all' || type === 'salon') && data.salons.map((salon) => (
              <Link key={salon.id} href={`/salon/${salon.slug}`} className="grid grid-cols-[140px_1fr] border border-lunea-line bg-white">
                <span className="relative min-h-[120px] bg-lunea-blush">{salon.cover ? <Image src={salon.cover} alt="" fill className="object-cover" sizes="140px" /> : null}</span>
                <span className="p-4">
                  <span className="text-[11px] tracking-[0.14em] text-lunea-muted">САЛОН</span>
                  <span className="mt-1 block font-display text-2xl">{salon.name}</span>
                  <span className="mt-1 block text-sm text-lunea-muted">{salon.city} · {Number(salon.rating).toFixed(1)} · от {money(salon.priceFrom)}</span>
                </span>
              </Link>
            ))}
            {(type === 'all' || type === 'master') && data.masters.map((master) => (
              <Link key={master.id} href={`/master/${master.slug}`} className="flex gap-4 border-b border-lunea-line py-4">
                <span className="relative h-20 w-16 shrink-0 bg-lunea-blush">{master.photo ? <Image src={master.photo} alt="" fill className="object-cover" sizes="64px" /> : null}</span>
                <span className="flex-1">
                  <span className="text-[11px] tracking-[0.14em] text-lunea-muted">МАСТЕР</span>
                  <span className="block">{personName(master)}</span>
                  <span className="text-sm text-lunea-muted">{master.specialization} · {master.experienceYears} лет · {Number(master.rating).toFixed(1)}</span>
                </span>
                <span className="text-sm">от {money(master.priceFrom)}</span>
              </Link>
            ))}
            {(type === 'all' || type === 'service') && data.services.map((service) => (
              <Link key={service.id} href={`/service/${service.id}`} className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-3">
                <span>
                  <span className="text-[11px] tracking-[0.14em] text-lunea-muted">{service.category?.nameEn}</span>
                  <span className="block text-lg">{service.name}</span>
                  <span className="text-sm text-lunea-muted">{service.salon?.name || 'Независимый мастер'} · {service.durationMin} мин</span>
                </span>
                <span>{money(service.price)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
