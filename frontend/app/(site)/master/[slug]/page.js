import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import FavoriteButton from '@/components/catalog/FavoriteButton';
import { money, personName, WEEKDAYS, yearsLabel } from '@/lib/format';
import { serverApi, siteUrl } from '@/lib/server';

export async function generateMetadata({ params }) {
  const payload = await serverApi(`/api/masters/${params.slug}`);
  const master = payload?.data;
  if (!master) return { title: 'Мастер' };
  const description = `${master.specialization}. ${master.city}. От ${master.priceFrom} ₽.`;
  return {
    title: personName(master),
    description,
    alternates: { canonical: `/master/${master.slug}` },
    openGraph: { title: personName(master), description, images: master.photo ? [master.photo] : [] },
  };
}

export default async function MasterPage({ params }) {
  const payload = await serverApi(`/api/masters/${params.slug}`);
  if (!payload?.data) notFound();
  const master = payload.data;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: personName(master),
    image: master.photo,
    jobTitle: master.specialization,
    url: `${siteUrl}/master/${master.slug}`,
  };
  return (
    <article className="page grid gap-10 pb-20 pt-28 lg:grid-cols-[0.8fr_1.2fr]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="relative min-h-[460px] bg-lunea-blush">
        {master.photo ? <Image src={master.photo} alt={personName(master)} fill className="object-cover" priority sizes="40vw" /> : null}
      </div>
      <div>
        <p className="eyebrow">{master.city}</p>
        <h1 className="display mt-3 text-5xl">{personName(master)}</h1>
        <p className="mt-3 text-lunea-muted">{master.specialization} · {yearsLabel(master.experienceYears)} · {Number(master.rating).toFixed(1)} · {master.reviewCount} отзывов</p>
        <p className="mt-2">от {money(master.priceFrom)}</p>
        <p className="mt-5 max-w-xl text-sm text-lunea-muted">{master.bio}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/book?master=${master.slug}`} className="btn">Записаться</Link>
          <FavoriteButton targetType="MASTER" targetId={master.id} />
        </div>
        {master.salon ? <p className="mt-6 text-sm">Работает в <Link href={`/salon/${master.salon.slug}`} className="underline">{master.salon.name}</Link></p> : <p className="mt-6 text-sm">Принимает самостоятельно</p>}
        {master.instagram ? <p className="mt-2 text-sm text-lunea-muted">Instagram @{master.instagram}</p> : null}
        <section className="mt-8">
          <h2 className="font-display text-2xl">Услуги</h2>
          {master.services.length ? master.services.map((service) => (
            <div key={service.id} className="flex items-baseline justify-between gap-4 border-b border-lunea-line py-3">
              <div>
                <p>{service.name}</p>
                <p className="text-sm text-lunea-muted">{service.durationMin} мин</p>
              </div>
              <div className="text-right">
                <p>{money(service.price)}</p>
                <Link href={`/book?master=${master.slug}&service=${service.id}`} className="text-sm">Выбрать</Link>
              </div>
            </div>
          )) : <p className="mt-3 text-sm text-lunea-muted">Услуг пока нет.</p>}
        </section>
        <section className="mt-8">
          <h2 className="font-display text-2xl">Ближайшие дни</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(master.nextDates || []).length ? master.nextDates.map((item) => (
              <Link key={item.date} href={`/book?master=${master.slug}&date=${item.date}`} className="border border-lunea-line px-3 py-2 text-sm">{item.date} · {item.count}</Link>
            )) : <p className="text-sm text-lunea-muted">Свободных окон на неделе нет.</p>}
          </div>
        </section>
        <section className="mt-8">
          <h2 className="font-display text-2xl">Часы</h2>
          <ul className="mt-3 text-sm">
            {(master.hours || []).map((hour) => (
              <li key={hour.id} className="flex max-w-xs justify-between py-1">
                <span>{WEEKDAYS[hour.dayOfWeek]}</span>
                <span>{hour.isOff ? 'выходной' : `${hour.startTime}–${hour.endTime}`}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-8">
          <h2 className="font-display text-2xl">Отзывы</h2>
          {(master.reviews || []).length ? master.reviews.map((review) => (
            <blockquote key={review.id} className="mt-4 border-t border-lunea-line pt-4">
              <p>{review.comment}</p>
              <p className="mt-2 text-sm text-lunea-muted">{review.rating}/5</p>
              {review.reply ? <p className="mt-2 text-sm">Ответ: {review.reply}</p> : null}
            </blockquote>
          )) : <p className="mt-3 text-sm text-lunea-muted">Отзывов пока нет.</p>}
        </section>
      </div>
    </article>
  );
}
