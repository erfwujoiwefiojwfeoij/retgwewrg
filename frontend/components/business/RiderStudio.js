'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/services/api';
import { COVER_BLOCKS, QUESTION_TYPES, RIDER_DESIGNS, defaultLayout, mergeLayout } from '@/lib/rider';
import Select from '@/components/ui/Select';
import Check from '@/components/ui/Check';
import { when } from '@/lib/format';

const emptyQuestion = () => ({ label: '', help: '', type: 'TEXT', required: false, optionsText: '' });

function Note({ children }) {
  return <p className="text-sm leading-5 text-lunea-muted">{children}</p>;
}

function toDraft(rider) {
  return {
    id: rider.id,
    title: rider.title,
    intro: rider.intro,
    design: rider.design,
    published: rider.published,
    customBg: rider.customBg || '#FFF9FA',
    customInk: rider.customInk || '#241B1F',
    customAccent: rider.customAccent || '#D9688A',
    customRadius: rider.customRadius ?? 28,
    layout: mergeLayout(rider.layout, rider.design),
    questions: rider.questions.map((question) => ({
      label: question.label,
      help: question.help || '',
      type: question.type,
      required: question.required,
      optionsText: (question.options || []).join('\n'),
    })),
  };
}

function payloadOf(draft) {
  return {
    title: draft.title,
    intro: draft.intro,
    design: draft.design,
    published: draft.published,
    customBg: draft.customBg,
    customInk: draft.customInk,
    customAccent: draft.customAccent,
    customRadius: Number(draft.layout?.radius) || 28,
    layout: draft.layout,
    questions: draft.questions.map((question) => ({
      label: question.label,
      help: question.help,
      type: question.type,
      required: question.required,
      options: question.optionsText.split('\n').map((item) => item.trim()).filter(Boolean),
    })),
  };
}

export default function RiderStudio() {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState(null);
  const [answers, setAnswers] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  function load() {
    api('/api/business/riders').then((payload) => setRows(payload.data)).catch(() => setRows([]));
  }
  useEffect(() => { load(); }, []);

  function patchQuestion(index, patch) {
    const questions = draft.questions.map((question, item) => (item === index ? { ...question, ...patch } : question));
    setDraft({ ...draft, questions });
  }

  async function save(event) {
    event.preventDefault();
    setError('');
    try {
      if (draft.id) await api(`/api/business/riders/${draft.id}`, { method: 'PUT', body: payloadOf(draft) });
      else await api('/api/business/riders', { method: 'POST', body: payloadOf(draft) });
      setDraft(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить');
    }
  }

  async function useTemplate() {
    setError('');
    try {
      await api('/api/business/riders', { method: 'POST', body: { template: true, title: 'Райдер визита', design: 'blush' } });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось создать');
    }
  }

  async function openAnswers(id) {
    const payload = await api(`/api/business/riders/${id}/answers`);
    setAnswers(payload);
  }

  async function copy(slug) {
    const link = `${window.location.origin}/r/${slug}`;
    await navigator.clipboard.writeText(link);
    setCopied(slug);
  }

  const layout = draft ? mergeLayout(draft.layout, draft.design) : null;

  function patchLayout(patch) {
    setDraft({ ...draft, layout: { ...layout, ...patch, colors: { ...layout.colors, ...(patch.colors || {}) } } });
  }

  function moveBlock(index, delta) {
    const blocks = [...layout.blocks];
    const next = index + delta;
    if (next < 0 || next >= blocks.length) return;
    [blocks[index], blocks[next]] = [blocks[next], blocks[index]];
    patchLayout({ blocks });
  }

  function moveQuestion(index, delta) {
    const questions = [...draft.questions];
    const next = index + delta;
    if (next < 0 || next >= questions.length) return;
    [questions[index], questions[next]] = [questions[next], questions[index]];
    setDraft({ ...draft, questions });
  }

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm leading-6 text-lunea-muted">Райдер — анкета перед визитом. Клиент открывает ссылку, читает первую страницу и отвечает на вопросы. Ответы приходят в кнопку «Ответы» у этой анкеты.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={useTemplate}>Готовый райдер</button>
        <button type="button" className="btn btn-line" onClick={() => setDraft({ title: 'Райдер визита', intro: 'Минута сейчас — и мастер встретит вас так, как вы любите.', design: 'paper', published: true, layout: defaultLayout('paper'), questions: [emptyQuestion()] })}>Свой с нуля</button>
      </div>
      <Note>Готовый райдер сразу спрашивает имя, телефон, напиток, температуру, общение и ограничения. «Свой с нуля» открывает пустую анкету: тексты, цвета и вопросы задаёте сами.</Note>
      {error ? <p className="text-sm text-lunea-accent">{error}</p> : null}
      <div className="divide-y divide-lunea-line border border-lunea-line bg-white">
        {rows.map((rider) => (
          <article key={rider.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div>
              <p>{rider.title}</p>
              <p className="text-sm text-lunea-muted">{rider.published ? 'Открыт' : 'Скрыт'} · ответов {rider.answers} · /r/{rider.slug}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="text-sm" onClick={() => copy(rider.slug)}>{copied === rider.slug ? 'Ссылка скопирована' : 'Ссылка'}</button>
              <button type="button" className="text-sm" onClick={() => openAnswers(rider.id)}>Ответы</button>
              <button type="button" className="text-sm" onClick={() => setDraft(toDraft(rider))}>Изменить</button>
              <button type="button" className="text-sm" onClick={async () => { await api(`/api/business/riders/${rider.id}`, { method: 'DELETE' }); load(); }}>Удалить</button>
            </div>
          </article>
        ))}
        {!rows.length ? <p className="px-4 py-6 text-sm text-lunea-muted">Райдера ещё нет. Готовый шаблон спрашивает про напиток, температуру, общение и ограничения.</p> : <p className="px-4 py-3 text-sm leading-5 text-lunea-muted">«Ссылка» копирует адрес для клиента. «Ответы» показывает, что уже прислали. «Изменить» открывает тексты, цвета и вопросы.</p>}
      </div>
      {answers ? (
        <section className="border border-lunea-line bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Ответы</h2>
            <button type="button" className="text-sm" onClick={() => setAnswers(null)}>Закрыть</button>
          </div>
          <Note>Каждая карточка — одна заполненная анкета. Сверху имя и телефон, ниже ответы по вопросам.</Note>
          {!answers.data.length ? <p className="mt-3 text-sm text-lunea-muted">Пока никто не заполнил.</p> : answers.data.map((item) => (
            <article key={item.id} className="mt-4 border-t border-lunea-line pt-4">
              <p>{item.clientName} {item.clientPhone ? `· ${item.clientPhone}` : ''}</p>
              <p className="text-xs text-lunea-muted">{when(item.createdAt)}</p>
              <dl className="mt-2 grid gap-1 text-sm">
                {(item.payload || []).map((field) => (
                  <div key={field.questionId}>
                    <dt className="text-lunea-muted">{field.label}</dt>
                    <dd>{Array.isArray(field.value) ? field.value.join(', ') : field.value === 'yes' ? 'Да' : field.value === 'no' ? 'Нет' : (field.value || '—')}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </section>
      ) : null}
      {draft ? (
        <form onSubmit={save} className="grid gap-4 border border-lunea-line bg-white p-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-3">
            <label className="block"><span className="label">Название</span><Note>Так анкета называется в списке кабинета. На странице клиента стоит заголовок из блока «Главная страница».</Note><input className="field mt-2" required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
            <label className="block"><span className="label">Заметка для кабинета</span><Note>Короткая пометка кабинета: зачем эта анкета. На странице клиента стоит текст из блока «Главная страница».</Note><textarea className="field mt-2 min-h-20" value={draft.intro} onChange={(event) => setDraft({ ...draft, intro: event.target.value })} /></label>
            <label className="inline-flex items-center gap-2 text-sm"><Check checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} />Ссылка открыта для клиентов</label>
            <Note>Пока галочка стоит, клиент открывает ссылку и заполняет анкету. Снимите её, чтобы ссылка перестала открываться.</Note>
            <div>
              <p className="label">Дизайн</p>
              <Note>Нажмите образец, чтобы подставить готовую палитру. Цвета, которые вы уже настроили ниже, заменятся на цвета этого образца.</Note>
              <div className="mt-2 flex flex-wrap gap-2">
                {RIDER_DESIGNS.map((item) => (
                  <button key={item.id} type="button" className="h-9 rounded-full border px-3 text-sm" style={{ background: draft.design === item.id ? item.accent : item.bg, color: draft.design === item.id ? '#fff' : item.ink, borderColor: item.accent }} onClick={() => setDraft({ ...draft, design: item.id, layout: { ...layout, colors: defaultLayout(item.id).colors, radius: defaultLayout(item.id).radius } })}>{item.name}</button>
                ))}
              </div>
            </div>
            <section className="grid gap-3 border border-lunea-line p-3">
              <p className="label">Главная страница</p>
              <Note>Первый экран по ссылке. Клиент читает его и нажимает кнопку, чтобы перейти к вопросам.</Note>
              <label className="text-sm">Надпись сверху<Note>Маленькая строка над заголовком. Например, «Перед визитом».</Note><input className="field mt-2" value={layout.eyebrow} onChange={(event) => patchLayout({ eyebrow: event.target.value })} /></label>
              <label className="text-sm">Заголовок<Note>Крупная фраза на первом экране. Её читают раньше всего.</Note><textarea className="field mt-2 min-h-16" value={layout.title} onChange={(event) => patchLayout({ title: event.target.value })} /></label>
              <label className="text-sm">Текст<Note>Одно-два предложения: зачем заполнить анкету и что от этого изменится на визите.</Note><textarea className="field mt-2 min-h-20" value={layout.text} onChange={(event) => patchLayout({ text: event.target.value })} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">Кнопка входа<Note>Открывает вопросы.</Note><input className="field mt-2" value={layout.button} onChange={(event) => patchLayout({ button: event.target.value })} /></label>
                <label className="text-sm">Кнопка отправки<Note>Стоит в конце анкеты и отправляет ответы в кабинет.</Note><input className="field mt-2" value={layout.submit} onChange={(event) => patchLayout({ submit: event.target.value })} /></label>
              </div>
              <Note>Слева или по центру — как стоят строки на экране клиента. «Сначала обложка» показывает приветствие отдельно, потом анкету. «Текст рядом с анкетой» ставит приветствие и вопросы на одной странице.</Note>
              <div className="flex flex-wrap gap-2 text-sm">
                <button type="button" className={`h-9 rounded-full px-4 ${layout.align === 'left' ? 'bg-lunea-accent text-white' : 'border border-lunea-line'}`} onClick={() => patchLayout({ align: 'left' })}>Слева</button>
                <button type="button" className={`h-9 rounded-full px-4 ${layout.align === 'center' ? 'bg-lunea-accent text-white' : 'border border-lunea-line'}`} onClick={() => patchLayout({ align: 'center' })}>По центру</button>
                <button type="button" className={`h-9 rounded-full px-4 ${layout.place === 'cover' ? 'bg-lunea-accent text-white' : 'border border-lunea-line'}`} onClick={() => patchLayout({ place: 'cover' })}>Сначала обложка</button>
                <button type="button" className={`h-9 rounded-full px-4 ${layout.place === 'split' ? 'bg-lunea-accent text-white' : 'border border-lunea-line'}`} onClick={() => patchLayout({ place: 'split' })}>Текст рядом с анкетой</button>
              </div>
              <Note>«Выше» и «Ниже» меняют порядок строк на главной: надпись, заголовок, текст и кнопка. Справа видно результат.</Note>
              <div className="grid gap-2">
                {layout.blocks.map((block, index) => (
                  <div key={block} className="flex items-center justify-between text-sm">
                    <span>{COVER_BLOCKS.find(([id]) => id === block)?.[1]}</span>
                    <span className="flex gap-2">
                      <button type="button" onClick={() => moveBlock(index, -1)}>Выше</button>
                      <button type="button" onClick={() => moveBlock(index, 1)}>Ниже</button>
                    </span>
                  </div>
                ))}
              </div>
            </section>
            <section className="grid gap-3 border border-lunea-line p-3">
              <p className="label">Цвета по отдельности</p>
              <Note>Каждый цвет красит только свою часть: фон, заголовок, обычный текст, вопросы, кнопку, текст на кнопке и выбранный ответ. Кружок открывает палитру.</Note>
              {[
                ['bg', 'Фон'],
                ['title', 'Заголовок'],
                ['text', 'Обычный текст'],
                ['question', 'Текст вопросов'],
                ['button', 'Кнопка'],
                ['buttonText', 'Текст на кнопке'],
                ['choice', 'Выбранный ответ'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-3 text-sm">
                  {label}
                  <input type="color" value={layout.colors[key]} onChange={(event) => patchLayout({ colors: { [key]: event.target.value } })} />
                </label>
              ))}
              <label className="text-sm">Скругление<Note>Насколько круглые кнопка и поля. 0 — прямые углы, 32 — сильно скруглённые.</Note><input className="field mt-2" type="number" min="0" max="32" value={layout.radius} onChange={(event) => patchLayout({ radius: Number(event.target.value) })} /></label>
            </section>
            <section className="grid gap-3 border border-lunea-line p-3">
              <p className="label">Экран после отправки</p>
              <Note>Клиент видит этот экран сразу после кнопки отправки. Напишите, что кабинет получил ответы и чего ждать дальше.</Note>
              <label className="text-sm">Заголовок<input className="field mt-2" value={layout.thanksTitle} onChange={(event) => patchLayout({ thanksTitle: event.target.value })} /></label>
              <label className="text-sm">Текст<textarea className="field mt-2 min-h-16" value={layout.thanksText} onChange={(event) => patchLayout({ thanksText: event.target.value })} /></label>
            </section>
            <section className="grid gap-3 border border-lunea-line p-3">
              <p className="label">Вопросы</p>
              <Note>На них клиент отвечает после главной страницы. «Выше» и «Ниже» меняют порядок. Тип решает, как отвечать: строка, телефон, список или «да / нет». Для списков каждый вариант пишите с новой строки. Подсказка показывается под вопросом. «Обязательный» не даст отправить анкету без ответа.</Note>
            {draft.questions.map((question, index) => (
              <div key={index} className="grid gap-2 border border-lunea-line p-3">
                <div className="flex gap-2">
                  <input className="field" placeholder="Вопрос" required value={question.label} onChange={(event) => patchQuestion(index, { label: event.target.value })} />
                  <button type="button" className="text-sm" onClick={() => moveQuestion(index, -1)}>Выше</button>
                  <button type="button" className="text-sm" onClick={() => moveQuestion(index, 1)}>Ниже</button>
                  <button type="button" className="text-sm" onClick={() => setDraft({ ...draft, questions: draft.questions.filter((_, item) => item !== index) })}>Убрать</button>
                </div>
                <Select className="field" value={question.type} onChange={(event) => patchQuestion(index, { type: event.target.value })}>
                  {QUESTION_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
                {['CHOICE', 'MULTI', 'LIST'].includes(question.type) ? (
                  <textarea className="field min-h-20" placeholder="Варианты, каждый с новой строки" value={question.optionsText} onChange={(event) => patchQuestion(index, { optionsText: event.target.value })} />
                ) : null}
                <input className="field" placeholder="Подсказка, если нужна" value={question.help} onChange={(event) => patchQuestion(index, { help: event.target.value })} />
                <label className="inline-flex items-center gap-2 text-sm"><Check checked={question.required} onChange={(event) => patchQuestion(index, { required: event.target.checked })} />Обязательный</label>
              </div>
            ))}
            <button type="button" className="btn btn-line" onClick={() => setDraft({ ...draft, questions: [...draft.questions, emptyQuestion()] })}>Ещё вопрос</button>
            </section>
            <button className="btn" type="submit">Сохранить райдер</button>
          </div>
          <div className="grid gap-2 self-start">
            <p className="label">Как увидит клиент</p>
            <Note>Главная страница обновляется сразу. На ссылке изменения появятся после «Сохранить райдер».</Note>
          <aside className="grid gap-4 p-5" style={{ background: layout.colors.bg, borderRadius: Math.min(layout.radius, 32), textAlign: layout.align }}>
            {layout.blocks.map((block) => {
              if (block === 'eyebrow') return <p key={block} className="text-xs uppercase tracking-[0.16em]" style={{ color: layout.colors.text }}>{layout.eyebrow}</p>;
              if (block === 'title') return <p key={block} className="font-display text-4xl leading-none" style={{ color: layout.colors.title }}>{layout.title}</p>;
              if (block === 'text') return <p key={block} className="text-sm" style={{ color: layout.colors.text }}>{layout.text}</p>;
              return <div key={block} className="inline-flex h-10 items-center px-5 text-sm" style={{ background: layout.colors.button, color: layout.colors.buttonText, borderRadius: Math.min(layout.radius, 999), justifySelf: layout.align === 'center' ? 'center' : 'start' }}>{layout.button}</div>;
            })}
          </aside>
          </div>
        </form>
      ) : null}
    </div>
  );
}
