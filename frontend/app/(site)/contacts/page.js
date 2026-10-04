export const metadata = { title: 'Контакты' };

export default function Page() {
  return (
    <article className="page max-w-2xl pb-24 pt-32">
      <h1 className="display text-5xl">Контакты</h1>
      <p className="mt-6">hello@lunea.test</p>
      <p className="mt-2 text-lunea-muted">Москва, для писем поддержки. Ответ в рабочие часы.</p>
    </article>
  );
}
