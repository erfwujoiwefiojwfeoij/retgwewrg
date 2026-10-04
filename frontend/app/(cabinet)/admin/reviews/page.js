'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export default function Page() {
  const [rows, setRows] = useState([]);
  function load() { api('/api/admin/reviews').then((payload) => setRows(payload.data)); }
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-3">
      {rows.map((review) => (
        <article key={review.id} className="border border-lunea-line bg-white p-4 text-sm">
          <p>{review.comment}</p>
          <button type="button" className="mt-2" onClick={async () => { await api(`/api/admin/reviews/${review.id}`, { method: 'DELETE' }); load(); }}>Удалить</button>
        </article>
      ))}
    </div>
  );
}
