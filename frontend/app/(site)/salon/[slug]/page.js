import Image from 'next/image';
import { notFound } from 'next/navigation';
import SalonVisit from '@/components/catalog/SalonVisit';
import { serverApi, siteUrl } from '@/lib/server';

export async function generateMetadata({ params }) {
  const payload = await serverApi(`/api/salons/${params.slug}`);
  const salon = payload?.data;
  if (!salon) return { title: 'Место' };
  return {
    title: salon.name,
    description: salon.description,
    alternates: { canonical: `/salon/${salon.slug}` },
    openGraph: { title: salon.name, description: salon.description, images: salon.cover ? [salon.cover] : [] },
  };
}

export default async function SalonPage({ params }) {
  const payload = await serverApi(`/api/salons/${params.slug}`);
  if (!payload?.data) notFound();
  const salon = payload.data;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: salon.name,
    image: salon.cover,
    address: { '@type': 'PostalAddress', streetAddress: salon.address, addressLocality: salon.city },
    aggregateRating: salon.reviewCount ? { '@type': 'AggregateRating', ratingValue: salon.rating, reviewCount: salon.reviewCount } : undefined,
    url: `${siteUrl}/salon/${salon.slug}`,
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'LUNEA', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: salon.name, item: `${siteUrl}/salon/${salon.slug}` },
    ],
  };
  return (
    <article className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <div className="relative h-[42vh] min-h-[280px] bg-lunea-blush">
        {salon.cover ? <Image src={salon.cover} alt="" fill className="object-cover" priority sizes="100vw" /> : null}
      </div>
      <div className="page -mt-12 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4 bg-lunea-bg p-2">
            <div className="flex items-center gap-4">
              <span className="relative h-16 w-16 overflow-hidden border border-lunea-line bg-white">
                {salon.logo ? <Image src={salon.logo} alt="" fill className="object-cover" sizes="64px" /> : null}
              </span>
              <div>
                <h1 className="display text-4xl md:text-5xl">{salon.name}</h1>
                <p className="mt-1 text-sm text-lunea-muted">{salon.city}, {salon.address} · {Number(salon.rating).toFixed(1)} · {salon.reviewCount} отзывов</p>
              </div>
            </div>
            <div className="flex gap-2">
              <FavoriteButton targetType="SALON" targetId={salon.id} />
              <Link href={`/book?salon=${salon.slug}`} className="btn">Записаться</Link>
            </div>
          </div>
          <p className={`mt-4 text-sm ${salon.open ? 'text-lunea-accent' : 'text-lunea-muted'}`}>{salon.open ? 'Сейчас открыт' : 'Сейчас закрыт'}</p>
          <section className="mt-10">
            <h2 className="font-display text-2xl">О месте</h2>
            <p className="mt-3 max-w-2xl text-lunea-muted">{salon.description}</p>
          </section>
          <section className="mt-10">
            <h2 className="font-display text-2xl">Услуги</h2>
            <div className="mt-4 divide-y divide-lunea-line">
              {salon.services.map((service) => (
                <div key={service.id} className="grid gap-2 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div>
                    <p>{service.name}</p>
                    <p className="text-sm text-lunea-muted">{service.category?.name} · {service.durationMin} мин</p>
                  </div>
                  <p>{money(service.price)}</p>
                  <Link href={`/book?salon=${salon.slug}&service=${service.id}`} className="text-sm">Записаться</Link>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-10">
            <h2 className="font-display text-2xl">Мастера</h2>
            {salon.masters.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {salon.masters.map((master) => (
                  <Link key={master.id} href={`/master/${master.slug}`} className="grid grid-cols-[88px_1fr] gap-3">
                    <span className="relative h-28 bg-lunea-blush">{master.photo ? <Image src={master.photo} alt={personName(master)} fill className="object-cover" sizes="88px" /> : null}</span>
                    <span>
                      <span className="block">{personName(master)}</span>
                      <span className="text-sm text-lunea-muted">{master.specialization}</span>
                      <span className="mt-2 block text-sm">{Number(master.rating).toFixed(1)} · от {money(master.priceFrom)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : <p className="mt-3 text-sm text-lunea-muted">Мастеров пока нет.</p>}
          </section>
          <section className="scroll-x mt-10 flex gap-3">
            {(salon.gallery || []).map((url) => (
              <span key={url} className="relative h-40 w-56 shrink-0 bg-lunea-blush">
                <Image src={url} alt="" fill className="object-cover" sizes="224px" />
              </span>
            ))}
          </section>
          <section className="mt-10">
            <h2 className="font-display text-2xl">Отзывы</h2>
            {salon.reviews.length ? salon.reviews.map((review) => (
              <blockquote key={review.id} className="mt-4 border-t border-lunea-line pt-4">
                <p>{review.comment}</p>
                <p className="mt-2 text-sm text-lunea-muted">{review.author?.profile?.firstName} · {review.rating}/5</p>
                {review.reply ? <p className="mt-2 text-sm">Ответ кабинета: {review.reply}</p> : null}
              </blockquote>
            )) : <p className="mt-3 text-sm text-lunea-muted">Отзывов пока нет.</p>}
          </section>
        </div>
        <aside className="space-y-8 border border-lunea-line bg-white p-5 h-fit">
          <div>
            <h2 className="text-sm tracking-[0.14em] text-lunea-muted">ЧАСЫ</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {salon.hours.map((hour) => (
                <li key={hour.id} className="flex justify-between">
                  <span>{WEEKDAYS[hour.dayOfWeek]}</span>
                  <span>{hour.isOff ? 'выходной' : `${hour.startTime}–${hour.endTime}`}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm tracking-[0.14em] text-lunea-muted">АДРЕС</h2>
            <p className="mt-2 text-sm">{salon.city}, {salon.address}</p>
            <p className="mt-1 text-sm text-lunea-muted">{salon.phone}</p>
            {salon.branches?.length ? salon.branches.map((branch) => (
              <p key={branch.id} className="mt-3 text-sm">{branch.name}: {branch.address}</p>
            )) : null}
          </div>
          <MessageForm salonId={salon.id} />
        </aside>
      </div>
    </article>
  );
}
