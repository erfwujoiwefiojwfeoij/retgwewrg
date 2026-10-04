import Link from 'next/link';
import { notFound } from 'next/navigation';
import FavoriteButton from '@/components/catalog/FavoriteButton';
import { money } from '@/lib/format';
import { serverApi, siteUrl } from '@/lib/server';

export async function generateMetadata({ params }) {
  const payload = await serverApi(`/api/services/${params.id}`);
  const service = payload?.data;
  if (!service) return { title: 'Услуга' };
  return {
    title: service.name,
    description: service.description || `${service.name}, ${service.durationMin} мин`,
    alternates: { canonical: `/service/${service.id}` },
  };
}

export default async function ServicePage({ params }) {
  const payload = await serverApi(`/api/services/${params.id}`);
  if (!payload?.data) notFound();
  const service = payload.data;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: service.salon ? { '@type': 'BeautySalon', name: service.salon.name } : undefined,
    offers: { '@type': 'Offer', price: service.price, priceCurrency: 'RUB' },
    url: `${siteUrl}/service/${service.id}`,
  };
  return (
    <article className="page max-w-3xl pb-20 pt-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="eyebrow">{service.category?.nameEn}</p>
      <h1 className="display mt-3 text-5xl">{service.name}</h1>
      <p className="mt-4 text-lunea-muted">{service.description}</p>
      <p className="mt-6">{money(service.price)} · {service.durationMin} мин</p>
      {service.salon ? <p className="mt-2 text-sm"><Link href={`/salon/${service.salon.slug}`}>{service.salon.name}</Link> · {service.salon.city}</p> : null}
      <div className="mt-8 flex gap-2">
        <Link className="btn" href={`/book?service=${service.id}${service.salon ? `&salon=${service.salon.slug}` : ''}${service.masters?.[0] ? `&master=${service.masters[0].master.slug}` : ''}`}>Записаться</Link>
        <FavoriteButton targetType="SERVICE" targetId={service.id} />
      </div>
      <h2 className="mt-10 font-display text-2xl">Мастера</h2>
      <ul className="mt-3 space-y-2">
        {service.masters.map((link) => (
          <li key={link.masterId}><Link href={`/master/${link.master.slug}`}>{link.master.firstName} {link.master.lastName}</Link></li>
        ))}
      </ul>
    </article>
  );
}
