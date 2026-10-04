'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { api } from '@/services/api';

const CITIES = ['Москва', 'Санкт-Петербург', 'Казань'];

export default function SearchIsland({ initialQuery = '', initialCity = 'Москва' }) {
  const router = useRouter();
  const box = useRef(null);
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity || 'Москва');
  const [open, setOpen] = useState(false);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [suggest, setSuggest] = useState(null);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    setRecent(JSON.parse(localStorage.getItem('lunea-recent') || '[]'));
  }, []);

  useEffect(() => {
    function onPointer(event) {
      if (!box.current?.contains(event.target)) {
        setOpen(false);
        setCitiesOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => {
      api(`/api/search/suggest?q=${encodeURIComponent(query)}`).then((payload) => setSuggest(payload.data)).catch(() => {});
    }, 180);
    return () => clearTimeout(timer);
  }, [query, open]);

  const options = [
    ...(suggest?.services || []).map((item) => ({ label: item.name, href: `/search?q=${encodeURIComponent(item.name)}&type=service` })),
    ...(suggest?.salons || []).map((item) => ({ label: item.name, href: `/salon/${item.slug}`, hint: 'место' })),
    ...(suggest?.masters || []).map((item) => ({ label: item.name, href: `/master/${item.slug}`, hint: 'мастер' })),
  ];

  function go(href, label) {
    const next = [label || query, ...recent.filter((item) => item !== (label || query))].filter(Boolean).slice(0, 5);
    localStorage.setItem('lunea-recent', JSON.stringify(next));
    setOpen(false);
    router.push(href);
  }

  function submit(event) {
    event?.preventDefault();
    if (open && options[active]) {
      go(options[active].href, options[active].label);
      return;
    }
    go(`/search?q=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}&type=all`, query);
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((value) => Math.min(options.length - 1, value + 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((value) => Math.max(0, value - 1));
    }
    if (event.key === 'Escape') setOpen(false);
  }

  return (
    <form ref={box} onSubmit={submit} className="relative rounded-full border border-lunea-line bg-white" role="search">
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        <div className="min-w-0 flex-1 px-5 py-3.5">
          <label className="font-display text-[12px] text-lunea-muted" htmlFor="q">Услуга или имя</label>
          <input
            id="q"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActive(0); }}
            onFocus={() => { setOpen(true); setCitiesOpen(false); }}
            onKeyDown={onKeyDown}
            placeholder="Маникюр, мастер, студия"
            className="mt-0.5 w-full bg-transparent text-[17px] leading-6 outline-none placeholder:text-[#b5a6ab]"
            autoComplete="off"
            aria-expanded={open}
            aria-controls="search-suggest"
          />
        </div>
        <div className="relative border-t border-lunea-line sm:w-52 sm:border-l sm:border-t-0">
          <button
            type="button"
            className="flex h-full w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
            aria-haspopup="listbox"
            aria-expanded={citiesOpen}
            onClick={() => { setCitiesOpen((value) => !value); setOpen(false); }}
          >
            <span>
              <span className="block font-display text-[12px] text-lunea-muted">Город</span>
              <span className="mt-0.5 block text-[17px] leading-6">{city}</span>
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-lunea-muted transition ${citiesOpen ? 'rotate-180' : ''}`} />
          </button>
          {citiesOpen ? (
            <ul className="absolute left-0 right-0 z-30 border border-lunea-line bg-white py-1 shadow-lift" role="listbox">
              {CITIES.map((item) => (
                <li key={item}>
                  <button type="button" className={`block w-full px-5 py-2.5 text-left text-[15px] hover:bg-lunea-blush ${item === city ? 'bg-lunea-blush' : ''}`} onClick={() => { setCity(item); setCitiesOpen(false); }}>{item}</button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="flex items-center border-t border-lunea-line p-3 sm:border-l sm:border-t-0">
          <button className="btn h-12 w-full px-6 sm:w-auto" type="submit">Найти</button>
        </div>
      </div>
      {open ? (
        <div id="search-suggest" className="absolute left-0 right-0 top-full z-20 mt-2 border border-lunea-line bg-white p-3 text-sm shadow-lift" role="listbox">
          {recent.length ? (
            <p className="px-2 pb-2 text-[11px] tracking-[0.14em] text-lunea-muted">НЕДАВНИЕ</p>
          ) : null}
          {recent.map((item) => (
            <button key={item} type="button" className="block w-full px-2 py-2 text-left hover:bg-lunea-blush" onClick={() => go(`/search?q=${encodeURIComponent(item)}&city=${encodeURIComponent(city)}`, item)}>{item}</button>
          ))}
          <p className="px-2 pb-2 pt-3 text-[11px] tracking-[0.14em] text-lunea-muted">ПОДСКАЗКИ</p>
          {options.length ? options.map((item, index) => (
            <button key={item.href + item.label} type="button" className={`flex w-full justify-between px-2 py-2 text-left ${index === active ? 'bg-lunea-blush' : ''}`} onMouseEnter={() => setActive(index)} onClick={() => go(item.href, item.label)}>
              <span>{item.label}</span>
              {item.hint ? <span className="text-lunea-muted">{item.hint}</span> : null}
            </button>
          )) : <p className="px-2 py-2 text-lunea-muted">Начните вводить услугу, место или имя</p>}
          {suggest?.popular?.length ? (
            <p className="px-2 pt-3 text-lunea-muted">Популярное: {suggest.popular.slice(0, 4).join(' · ')}</p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
