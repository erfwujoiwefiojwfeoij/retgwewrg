'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const words = ['кабинете', 'календаре', 'расписании', 'графике'];

function RotatingWord() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return undefined;
    const timer = setInterval(() => setIndex((value) => (value + 1) % words.length), 2600);
    return () => clearInterval(timer);
  }, [reduce]);

  const word = words[index];

  return (
    <span className="inline-block px-[0.04em] align-baseline leading-[1.15]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={word}
          className="inline-block"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
        >
          <span className="text-gradient inline-block px-[0.08em] leading-[1.4]">{word}</span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const nav = ['Обзор', 'Календарь', 'Записи', 'Мастера', 'Клиенты', 'Услуги', 'Аналитика'];

const stats = [
  ['Сегодня', '8'],
  ['Выручка', '86 400'],
  ['Новые клиенты', '3'],
  ['Загрузка', '72%'],
];

const visits = [
  ['10:00', 'Маникюр', 'подтверждена'],
  ['12:30', 'Брови', 'подтверждена'],
  ['15:00', 'Стрижка', 'ожидает'],
  ['18:00', 'Уход', 'подтверждена'],
];

const bars = [28, 46, 34, 62, 40, 78, 55, 48, 70, 36, 84, 60, 44, 72];

const plans = [
  {
    name: 'Старт',
    price: '990',
    text: 'Для мастера, который ведёт день сам.',
    points: ['Календарь и записи', 'Один мастер', 'Напоминания клиентам'],
  },
  {
    name: 'Студия',
    price: '2 490',
    text: 'Для команды: салон, студия или кабинет с общей базой.',
    points: ['До 8 мастеров', 'Клиенты и история визитов', 'Аналитика загрузки'],
    popular: true,
  },
  {
    name: 'Сеть',
    price: '5 900',
    text: 'Для нескольких филиалов в одном кабинете.',
    points: ['Филиалы без лимита', 'Роли администраторов', 'Сводная выручка'],
  },
];

const modules = [
  ['01', 'Календарь', 'День, неделя и месяц. Окна не накладываются на перерывы и выходные.'],
  ['02', 'Записи', 'Подтверждение, перенос, отмена и неявка остаются в одной ленте.'],
  ['03', 'Мастера', 'График, услуги и загрузка каждого мастера.'],
  ['04', 'Клиенты', 'История визитов и карточка клиента в кабинете.'],
  ['05', 'Услуги', 'Цена, длительность и кто из мастеров её оказывает.'],
  ['06', 'Аналитика', 'Выручка, новые клиенты и заполненность дня.'],
];

export default function HomePage() {
  return (
    <div>
      <section className="px-4 pb-16 pt-32 md:pt-40">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ lineHeight: 1.12 }} className="display mx-auto max-w-4xl text-center text-[46px] md:text-[80px]">
          Запись живёт<br />в одном <RotatingWord />.
        </motion.h1>
        <p className="mx-auto mt-6 max-w-lg text-center text-base text-lunea-muted md:text-lg">
          Салон, студия, барбершоп или мастер, который работает сам. Расписание, люди и день — в одном месте.
        </p>
        <p className="mt-4 text-center text-xs tracking-[0.16em] text-lunea-muted">САЛОН · СТУДИЯ · БАРБЕРШОП · КАБИНЕТ · ЧАСТНЫЙ МАСТЕР</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register?role=SALON_OWNER" className="btn">Открыть кабинет</Link>
          <Link href="/login" className="btn btn-line">Войти</Link>
        </div>
      </section>

      <section className="page pb-24" aria-label="Обзор кабинета">
        <div className="overflow-hidden rounded-[32px] border border-lunea-line bg-white">
          <div className="grid md:grid-cols-[200px_1fr]">
            <div className="flex gap-1 overflow-x-auto border-b border-lunea-line p-3 md:flex-col md:border-b-0 md:border-r md:p-4">
              {nav.map((item) => (
                <span key={item} className={`shrink-0 rounded-full px-3 py-2 text-sm ${item === 'Обзор' ? 'bg-lunea-blush' : 'text-lunea-muted'}`}>{item}</span>
              ))}
            </div>
            <div className="p-4 md:p-6">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-2xl">Обзор</h2>
                <span className="text-sm text-lunea-muted">Сегодня</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map(([label, value]) => (
                  <div key={label} className="rounded-3xl border border-lunea-line p-3">
                    <p className="text-xs text-lunea-muted">{label}</p>
                    <p className="font-display text-3xl">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-3xl border border-lunea-line p-4">
                  <p className="text-sm text-lunea-muted">Ближайшие</p>
                  <ul className="mt-2">
                    {visits.map(([time, service, status]) => (
                      <li key={time} className="flex items-center justify-between gap-3 border-b border-lunea-line py-3 text-sm last:border-b-0">
                        <span>{time} · {service}</span>
                        <span className="text-lunea-muted">{status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-lunea-line p-4">
                  <p className="text-sm text-lunea-muted">14 дней</p>
                  <div className="mt-4 flex h-28 items-end gap-1">
                    {bars.map((height, index) => (
                      <span key={index} className="flex-1 rounded-t-full bg-lunea-pink" style={{ height: `${height}%` }} />
                    ))}
                  </div>
                  <p className="mt-4 text-sm">Мастеров: 4 · услуг: 18</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page pb-24">
        <h2 className="display max-w-xl text-4xl md:text-5xl">Всё, чем кабинет пользуется каждый день</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(([num, title, text]) => (
            <div key={num} className="rounded-[28px] border border-lunea-line bg-white px-6 py-8">
              <p className="text-[11px] text-lunea-muted">{num}</p>
              <h3 className="mt-4 font-display text-3xl">{title}</h3>
              <p className="mt-2 max-w-xs text-sm text-lunea-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page pb-24">
        <div className="relative grid gap-10 md:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-lunea-line md:block" />
          {[
            ['01', 'Откройте кабинет', 'Название, город и команда. Подойдёт салону, студии и частному мастеру.'],
            ['02', 'Соберите график', 'Услуги, мастера, часы работы и выходные.'],
            ['03', 'Ведите день', 'Записи приходят в календарь и подтверждаются здесь же.'],
          ].map(([num, title, text]) => (
            <div key={num}>
              <p className="relative z-10 inline-block bg-lunea-bg pr-3 font-display text-5xl text-lunea-pink">{num}</p>
              <h3 className="mt-4 font-display text-3xl">{title}</h3>
              <p className="mt-2 max-w-xs text-sm text-lunea-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page pb-24">
        <h2 className="display text-4xl md:text-5xl">Тарифы</h2>
        <div className="mt-10 grid items-stretch gap-4 md:grid-cols-3 md:items-center">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col rounded-[32px] border bg-white px-6 py-8 ${plan.popular ? 'border-lunea-accent md:-my-3 md:py-10' : 'border-lunea-line'}`}>
              {plan.popular ? <span className="absolute -top-3 left-6 rounded-full bg-lunea-accent px-3 py-1 text-xs text-white">Популярный</span> : null}
              <h3 className="font-display text-3xl">{plan.name}</h3>
              <p className="mt-3 text-sm text-lunea-muted">{plan.text}</p>
              <p className="mt-6 font-display text-5xl">{plan.price}<span className="ml-1 text-lg text-lunea-muted">₽</span></p>
              <p className="text-sm text-lunea-muted">в месяц</p>
              <ul className="mt-6 space-y-2 border-t border-lunea-line pt-6 text-sm">
                {plan.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
              <Link href="/register?role=SALON_OWNER" className={`btn mt-8 w-fit ${plan.popular ? '' : 'btn-line'}`}>{plan.popular ? 'Выбрать' : 'Подключить'}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="page pb-28 text-center">
        <h2 className="display text-5xl md:text-7xl">Кабинет<br />открывается здесь.</h2>
        <div className="mt-8 flex justify-center">
          <Link href="/register?role=SALON_OWNER" className="btn">Открыть кабинет</Link>
        </div>
      </section>
    </div>
  );
}
