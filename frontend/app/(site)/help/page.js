export const metadata = { title: 'Помощь' };

const items = [
  ['Как записаться', 'Найдите услугу, мастера и свободное окно. После подтверждения запись появится в кабинете.'],
  ['Как отменить', 'Открытая запись отменяется в разделе «Мои записи», пока визит не завершён.'],
  ['Как открыть кабинет', 'Зарегистрируйтесь как владелец и заполните карточку: салон, студия, барбершоп или частная практика. Дальше добавляются мастера, услуги и часы.'],
];

export default function Page() {
  return (
    <article className="page max-w-2xl pb-24 pt-32">
      <h1 className="display text-5xl">Помощь</h1>
      <div className="mt-8 divide-y divide-lunea-line">
        {items.map(([title, text]) => (
          <section key={title} className="py-5">
            <h2 className="font-display text-2xl">{title}</h2>
            <p className="mt-2 text-sm text-lunea-muted">{text}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
