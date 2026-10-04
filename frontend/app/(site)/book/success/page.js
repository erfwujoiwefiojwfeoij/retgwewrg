import Link from 'next/link';

export const metadata = { title: 'Запись создана' };

export default function Page({ searchParams }) {
  return (
    <div className="page max-w-xl pb-28 pt-36">
      <p className="eyebrow">Готово</p>
      <h1 className="display mt-4 text-5xl">Запись создана</h1>
      <p className="mt-4 text-lunea-muted">Номер {searchParams.id || ''}. Статус — ожидает подтверждения кабинета.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/dashboard/appointments" className="btn">Мои записи</Link>
        <Link href="/" className="btn btn-line">На главную</Link>
      </div>
    </div>
  );
}
