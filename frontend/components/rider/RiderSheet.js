'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/services/api';
import { mergeLayout } from '@/lib/rider';
import Select from '@/components/ui/Select';

function Field({ question, value, onChange, layout }) {
  const { colors, radius } = layout;
  const common = {
    className: 'mt-2 w-full border bg-white/80 px-4 py-3 text-sm outline-none',
    style: { borderColor: colors.question, borderRadius: Math.min(radius, 28), color: '#241B1F' },
  };
  if (question.type === 'LONG') {
    return <textarea {...common} rows={4} value={value || ''} onChange={(event) => onChange(event.target.value)} />;
  }
  if (question.type === 'CHOICE' || question.type === 'YESNO') {
    const options = question.type === 'YESNO' ? [['yes', 'Да'], ['no', 'Нет']] : question.options.map((item) => [item, item]);
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map(([key, label]) => {
          const on = value === key;
          return (
            <button key={key} type="button" className="border px-4 py-2 text-sm" style={{ borderRadius: 999, borderColor: on ? colors.choice : colors.question, background: on ? colors.choice : 'transparent', color: on ? colors.buttonText : colors.question }} onClick={() => onChange(key)}>
              {label}
            </button>
          );
        })}
      </div>
    );
  }
  if (question.type === 'MULTI') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {question.options.map((item) => {
          const on = selected.includes(item);
          return (
            <button key={item} type="button" className="border px-4 py-2 text-sm" style={{ borderRadius: 999, borderColor: on ? colors.choice : colors.question, background: on ? colors.choice : 'transparent', color: on ? colors.buttonText : colors.question }} onClick={() => onChange(on ? selected.filter((entry) => entry !== item) : [...selected, item])}>
              {item}
            </button>
          );
        })}
      </div>
    );
  }
  if (question.type === 'LIST') {
    return (
      <div className="mt-2">
        <Select className="field" value={value || ''} onChange={(event) => onChange(event.target.value)}>
          <option value="">Выберите</option>
          {question.options.map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
      </div>
    );
  }
  const inputType = question.type === 'PHONE' ? 'tel' : question.type === 'EMAIL' ? 'email' : question.type === 'NUMBER' ? 'number' : question.type === 'DATE' ? 'date' : 'text';
  return <input {...common} type={inputType} value={value || ''} onChange={(event) => onChange(event.target.value)} />;
}

function Cover({ rider, layout, onStart }) {
  const { colors } = layout;
  const align = layout.align === 'center' ? 'text-center items-center' : 'text-left items-start';
  const parts = {
    eyebrow: <p key="eyebrow" className="text-xs uppercase tracking-[0.18em]" style={{ color: colors.text }}>{layout.eyebrow}</p>,
    title: <h1 key="title" className="font-display text-5xl leading-none" style={{ color: colors.title }}>{layout.title}</h1>,
    text: <p key="text" className="max-w-md text-sm leading-6" style={{ color: colors.text }}>{layout.text}</p>,
    button: <button key="button" type="button" className="h-12 px-6 text-sm" style={{ background: colors.button, color: colors.buttonText, borderRadius: Math.min(layout.radius, 999) }} onClick={onStart}>{layout.button}</button>,
  };
  return (
    <div className={`grid max-w-xl gap-5 ${align}`}>
      <p className="text-xs uppercase tracking-[0.18em]" style={{ color: colors.text }}>{rider.salon?.name}</p>
      {layout.blocks.map((block) => parts[block])}
    </div>
  );
}

export default function RiderSheet({ slug }) {
  const [rider, setRider] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [step, setStep] = useState('cover');

  useEffect(() => {
    api(`/api/riders/${slug}`).then((payload) => setRider(payload.data)).catch(() => setError('Райдер не найден'));
  }, [slug]);

  if (error) return <p className="p-10 text-center">{error}</p>;
  if (!rider) return <p className="p-10 text-center">Открываем анкету</p>;
  const layout = mergeLayout(rider.layout, rider.design);
  const split = layout.place === 'split';

  async function send(event) {
    event.preventDefault();
    setError('');
    try {
      await api(`/api/riders/${slug}`, { method: 'POST', body: { answers } });
      setStep('thanks');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось отправить');
    }
  }

  const form = (
    <form onSubmit={send} className={`grid max-w-xl gap-6 ${layout.align === 'center' ? 'mx-auto text-center' : ''}`}>
      {rider.questions.map((question) => (
        <label key={question.id} className="block text-left">
          <span className="text-sm" style={{ color: layout.colors.question }}>{question.label}{question.required ? ' *' : ''}</span>
          {question.help ? <span className="mt-1 block text-xs" style={{ color: layout.colors.text }}>{question.help}</span> : null}
          <Field question={question} layout={layout} value={answers[question.id]} onChange={(value) => setAnswers({ ...answers, [question.id]: value })} />
        </label>
      ))}
      {error ? <p className="text-sm" style={{ color: layout.colors.title }}>{error}</p> : null}
      <button type="submit" className="h-12 px-6 text-sm" style={{ background: layout.colors.button, color: layout.colors.buttonText, borderRadius: Math.min(layout.radius, 999) }}>{layout.submit}</button>
    </form>
  );

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: layout.colors.bg }}>
      <div className={`mx-auto ${split && step === 'form' ? 'grid max-w-5xl items-start gap-10 md:grid-cols-2' : 'max-w-xl'}`}>
        {step === 'cover' ? <Cover rider={rider} layout={layout} onStart={() => setStep('form')} /> : null}
        {step === 'form' ? (
          <>
            {split ? <Cover rider={rider} layout={layout} onStart={() => setStep('form')} /> : null}
            {form}
          </>
        ) : null}
        {step === 'thanks' ? (
          <div className={layout.align === 'center' ? 'text-center' : ''}>
            <h1 className="font-display text-5xl leading-none" style={{ color: layout.colors.title }}>{layout.thanksTitle}</h1>
            <p className="mt-4 text-sm leading-6" style={{ color: layout.colors.text }}>{layout.thanksText}</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
