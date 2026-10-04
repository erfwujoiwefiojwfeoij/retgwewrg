'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { EmptyState, Skeleton } from '@/components/ui/States';

export default function Messages({ scope }) {
  const [threads, setThreads] = useState(null);
  const [active, setActive] = useState(null);
  const [text, setText] = useState('');

  function load() {
    api(`/api/messages${scope ? '?scope=business' : ''}`).then((payload) => setThreads(payload.data));
  }
  useEffect(() => { load(); }, [scope]);

  async function open(id) {
    const payload = await api(`/api/messages/${id}`);
    setActive(payload.data);
  }

  async function send(event) {
    event.preventDefault();
    await api(`/api/messages/${active.id}`, { method: 'POST', body: { body: text } });
    setText('');
    open(active.id);
    load();
  }

  if (!threads) return <Skeleton className="h-40" />;
  if (!threads.length) return <EmptyState title="Сообщений нет" text="Диалог появится, когда вы напишете в кабинет." />;

  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      <div className="border border-lunea-line bg-white">
        {threads.map((thread) => (
          <button key={thread.id} type="button" className="block w-full border-b border-lunea-line px-3 py-3 text-left" onClick={() => open(thread.id)}>
            <span className="block text-sm">{thread.subject}</span>
            <span className="text-xs text-lunea-muted">{thread.messages?.[0]?.body}</span>
          </button>
        ))}
      </div>
      <div className="border border-lunea-line bg-white p-4">
        {active ? (
          <>
            <h2 className="font-display text-2xl">{active.subject}</h2>
            <div className="mt-4 space-y-3">
              {active.messages.map((message) => (
                <p key={message.id} className="text-sm"><span className="text-lunea-muted">{message.author?.profile?.firstName}: </span>{message.body}</p>
              ))}
            </div>
            <form onSubmit={send} className="mt-4 flex gap-2">
              <input className="field" value={text} onChange={(event) => setText(event.target.value)} required />
              <button className="btn" type="submit">Отправить</button>
            </form>
          </>
        ) : <p className="text-sm text-lunea-muted">Выберите диалог</p>}
      </div>
    </div>
  );
}
