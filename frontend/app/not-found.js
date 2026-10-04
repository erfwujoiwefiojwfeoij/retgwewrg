import Link from 'next/link';
import { Mark } from '@/components/brand/Logo';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <div className="page-enter text-center">
        <div className="relative mx-auto h-44 w-44">
          <div className="absolute inset-3 rounded-full border border-lunea-line" />
          <div className="orbit absolute inset-3">
            <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lunea-accent" />
          </div>
          <div className="drift absolute inset-0 grid place-items-center">
            <span className="grid h-24 w-24 place-items-center rounded-full bg-lunea-blush">
              <Mark className="h-12 w-12" />
            </span>
          </div>
        </div>
        <p className="display mt-8 text-7xl md:text-8xl">404</p>
        <h1 className="mt-4 font-display text-3xl">Страница сошла с орбиты</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-lunea-muted">
          Этого адреса нет. Запись, студия или кабинет могли переехать — день продолжается на главной.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn">На главную</Link>
          <Link href="/search" className="btn btn-line">Найти место</Link>
        </div>
      </div>
    </main>
  );
}
