'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Gate } from '@/components/business/WorkspaceGate';
import { EmptyState } from '@/components/ui/States';
import { when } from '@/lib/format';

function Team() {
  const [members, setMembers] = useState([]);
  const [chat, setChat] = useState([]);
  const [name, setName] = useState({ firstName: '', lastName: '' });
  const [issued, setIssued] = useState(null);
  const [text, setText] = useState('');
  function load() {
    api('/api/business/members').then((payload) => setMembers(payload.data));
    api('/api/business/chat').then((payload) => setChat(payload.data));
  }
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-2xl">Администраторы</h2>
        <form className="flex flex-wrap gap-2" onSubmit={async (event) => {
          event.preventDefault();
          const payload = await api('/api/business/members', { method: 'POST', body: name });
          setIssued(payload.data);
          setName({ firstName: '', lastName: '' });
          load();
        }}>
          <input className="field w-auto" required placeholder="Имя" value={name.firstName} onChange={(event) => setName({ ...name, firstName: event.target.value })} />
          <input className="field w-auto" required placeholder="Фамилия" value={name.lastName} onChange={(event) => setName({ ...name, lastName: event.target.value })} />
          <button className="btn" type="submit">Выдать доступ</button>
        </form>
        {issued ? <p className="text-sm">Логин {issued.login}, пароль {issued.password}. Покажите один раз.</p> : null}
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between border border-lunea-line bg-white px-4 py-3 text-sm">
            <span>{member.name}</span>
            <button type="button" onClick={async () => { await api(`/api/business/members/${member.id}`, { method: 'DELETE' }); load(); }}>Убрать</button>
          </div>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-2xl">Чат команды</h2>
        <div className="max-h-80 space-y-2 overflow-auto border border-lunea-line bg-white p-4">
          {chat.map((item) => <p key={item.id} className="text-sm"><span className="text-lunea-muted">{item.author} · {when(item.createdAt)}</span><br />{item.body}</p>)}
        </div>
        <form className="flex gap-2" onSubmit={async (event) => { event.preventDefault(); await api('/api/business/chat', { method: 'POST', body: { body: text } }); setText(''); load(); }}>
          <input className="field" required value={text} onChange={(event) => setText(event.target.value)} placeholder="Сообщение смене" />
          <button className="btn" type="submit">Отправить</button>
        </form>
      </section>
    </div>
  );
}

export default function Page() {
  return <Gate>{(space) => (space.type === 'salon' ? <Team /> : <EmptyState title="Команда" text="Администраторов добавляет кабинет." />)}</Gate>;
}
