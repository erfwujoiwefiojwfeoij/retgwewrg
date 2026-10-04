'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Suspense } from 'react';
import BookingFlow from '@/components/booking/BookingFlow';
import FavoriteButton from '@/components/catalog/FavoriteButton';
import MessageForm from '@/components/catalog/MessageForm';
import { Skeleton } from '@/components/ui/States';
import { money, personName, WEEKDAYS } from '@/lib/format';

function Stars({ value }) {
  const score = Number(value) || 0;
  const filled = Math.round(score);
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${score.toFixed(1)} из 5`}>
      <span className="inline-flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} viewBox="0 0 16 16" className={`h-3.5 w-3.5 ${star <= filled ? 'text-lunea-accent' : 'text-lunea-line'}`} fill="currentColor" aria-hidden="true">
            <path d="M8 1.4 9.8 5.8l4.7.4-3.6 3.1 1.1 4.6L8 11.6 3.9 13.9l1.1-4.6L1.5 6.2l4.7-.4L8 1.4Z" />
          </svg>
        ))}
      </span>
      <span className="text-sm">{score.toFixed(1)}</span>
    </span>
  );
}

export default function SalonVisit({ salon }) {
  const [pick, setPick] = useState(null);
  const photos = [...new Set((salon.gallery?.length ? salon.gallery : [salon.cover, salon.logo]).filter(Boolean))];
  const priceFrom = salon.priceFrom || Math.min(...(salon.services || []).map((service) => service.price).filter((price) => price > 0), Infinity);

  function choose(next) {
    setPick({ ...next, token: Date.now() });
    document.getElementById('zapis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="page -mt-16 grid gap-10 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="rounded-[32px] bg-lunea-bg p-2">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="relative h-16 w-16 overflow-hidden rounded-full border border-lunea-line bg-white">
                {salon.logo ? <Image src={salon.logo} alt="" fill className="object-cover" sizes="64px" /> : null}
              </span>
              <div>
                <h1 className="display text-4xl md:text-5xl">{salon.name}</h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-lunea-muted">
                  <span>{salon.city}, {salon.address}</span>
                  <Stars value={salon.rating} />
                  <span>{salon.reviewCount} отзывов</span>
                  {Number.isFinite(priceFrom) ? <span>от {money(priceFrom)}</span> : null}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <FavoriteButton targetType="SALON" targetId={salon.id} />
              <button type="button" className="btn" onClick={() => choose({})}>Записаться</button>
            </div>
          </div>
        </div>
        <p className={`mt-4 text-sm ${salon.open ? 'text-lunea-accent' : 'text-lunea-muted'}`}>{salon.open ? 'Сейчас открыт' : 'Сейчас закрыт'}</p>

        <section className="mt-10">
          <h2 className="font-display text-2xl">О месте</h2>
          <p className="mt-3 max-w-2xl leading-7 text-lunea-muted">{salon.description}</p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl">Фото</h2>
          {photos.length ? (
            <div className="scroll-x mt-4 flex gap-3">
              {photos.map((url) => (
                <span key={url} className="relative h-44 w-64 shrink-0 overflow-hidden rounded-[28px] bg-lunea-blush">
                  <Image src={url} alt="" fill className="object-cover" sizes="256px" />
                </span>
              ))}
            </div>
          ) : <p className="mt-3 text-sm text-lunea-muted">Фото пока не добавлены.</p>}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl">Услуги и цены</h2>
          <p className="mt-2 text-sm text-lunea-muted">Выберите услугу — запись откроется с ней.</p>
          <div className="mt-4 divide-y divide-lunea-line">
            {(salon.services || []).map((service) => (
              <div key={service.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <p>{service.name}</p>
                  <p className="text-sm text-lunea-muted">{service.category?.name} · {service.durationMin} мин</p>
                </div>
                <p>{money(service.price)}</p>
                <button type="button" className="btn h-9" onClick={() => choose({ serviceId: service.id })}>Выбрать</button>
              </div>
            ))}
            {!salon.services?.length ? <p className="py-4 text-sm text-lunea-muted">Услуг пока нет.</p> : null}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl">Мастера</h2>
          <p className="mt-2 text-sm text-lunea-muted">Можно выбрать мастера сразу. Если услуга уже выбрана, откроются свободные даты.</p>
          {salon.masters?.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {salon.masters.map((master) => (
                <div key={master.id} className="grid grid-cols-[88px_1fr] gap-3 rounded-[28px] border border-lunea-line bg-white p-3">
                  <span className="relative h-28 overflow-hidden rounded-[22px] bg-lunea-blush">
                    {master.photo ? <Image src={master.photo} alt={personName(master)} fill className="object-cover" sizes="88px" /> : null}
                  </span>
                  <span>
                    <span className="block">{personName(master)}</span>
                    <span className="text-sm text-lunea-muted">{master.specialization}</span>
                    <span className="mt-2 flex items-center gap-2 text-sm">
                      <Stars value={master.rating} />
                      <span className="text-lunea-muted">от {money(master.priceFrom)}</span>
                    </span>
                    <button type="button" className="mt-3 text-sm" onClick={() => choose({ serviceId: pick?.serviceId, masterId: master.id })}>К этому мастеру</button>
                  </span>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-sm text-lunea-muted">Мастеров пока нет.</p>}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl">Отзывы</h2>
          {salon.reviews?.length ? salon.reviews.map((review) => (
            <blockquote key={review.id} className="mt-4 border-t border-lunea-line pt-4">
              <Stars value={review.rating} />
              <p className="mt-2">{review.comment}</p>
              <p className="mt-2 text-sm text-lunea-muted">{review.author?.profile?.firstName || 'Гость'}</p>
              {review.reply ? <p className="mt-2 text-sm">Ответ кабинета: {review.reply}</p> : null}
            </blockquote>
          )) : <p className="mt-3 text-sm text-lunea-muted">Отзывов пока нет.</p>}
        </section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div id="zapis" className="scroll-mt-24 rounded-[32px] border border-lunea-line bg-white p-5">
          <h2 className="font-display text-2xl">Запись</h2>
          <p className="mt-2 text-sm text-lunea-muted">Услуга, мастер, дата и время. Ссылка этой страницы ведёт сразу сюда.</p>
          <div className="mt-5">
            <Suspense fallback={<Skeleton className="h-40" />}>
              <BookingFlow salonSlug={salon.slug} pick={pick} />
            </Suspense>
          </div>
        </div>
        <div className="rounded-[32px] border border-lunea-line bg-white p-5">
          <h2 className="text-sm tracking-[0.14em] text-lunea-muted">ЧАСЫ</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {(salon.hours || []).map((hour) => (
              <li key={hour.id || hour.dayOfWeek} className="flex justify-between">
                <span>{WEEKDAYS[hour.dayOfWeek]}</span>
                <span>{hour.isOff ? 'выходной' : `${hour.startTime}–${hour.endTime}`}</span>
              </li>
            ))}
          </ul>
          <h2 className="mt-6 text-sm tracking-[0.14em] text-lunea-muted">АДРЕС</h2>
          <p className="mt-2 text-sm">{salon.city}, {salon.address}</p>
          {salon.phone ? <a className="mt-1 block text-sm text-lunea-muted" href={`tel:${salon.phone}`}>{salon.phone}</a> : null}
          {(salon.branches || []).map((branch) => (
            <p key={branch.id} className="mt-3 text-sm">{branch.name}: {branch.address}</p>
          ))}
          <div className="mt-6">
            <MessageForm salonId={salon.id} />
          </div>
        </div>
      </aside>
    </div>
  );
}
