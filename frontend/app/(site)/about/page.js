export const metadata = { title: 'О проекте' };

export default function Page() {
  return (
    <article className="page max-w-2xl pb-24 pt-32">
      <p className="eyebrow">Company</p>
      <h1 className="display mt-4 text-5xl">О LUNEA</h1>
      <p className="mt-6 text-lunea-muted">LUNEA соединяет клиента, мастера и кабинет вокруг одной записи. Кабинет может быть салоном, студией, барбершопом или местом одного мастера. Клиент видит свободное время. Команда ведёт расписание, людей и отзывы.</p>
    </article>
  );
}
