import Link from 'next/link';
import Logo from '@/components/brand/Logo';

export default function Footer() {
  return (
    <footer className="bg-lunea-dark text-[#F6EEEF]">
      <div className="page grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm text-[#C8B8BD]">Запись для салона, студии и частного мастера.</p>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.22em] text-[#C8B8BD]">PRODUCT</p>
          <div className="mt-4 grid gap-2 text-sm">
            <Link href="/search">Для клиентов</Link>
            <Link href="/login">Для мастеров</Link>
            <Link href="/register?role=SALON_OWNER">Для кабинета</Link>
          </div>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.22em] text-[#C8B8BD]">COMPANY</p>
          <div className="mt-4 grid gap-2 text-sm">
            <Link href="/about">О проекте</Link>
            <Link href="/help">Помощь</Link>
            <Link href="/contacts">Контакты</Link>
          </div>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.22em] text-[#C8B8BD]">LEGAL</p>
          <div className="mt-4 grid gap-2 text-sm">
            <Link href="/privacy">Политика</Link>
            <Link href="/terms">Условия</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
