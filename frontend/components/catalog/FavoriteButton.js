'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { api } from '@/services/api';

export default function FavoriteButton({ targetType, targetId, initial = false }) {
  const { user } = useAuth() || {};
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  async function toggle() {
    if (!user) {
      router.push('/login');
      return;
    }
    const payload = await api('/api/favorites', { method: 'POST', body: { targetType, targetId } });
    setSaved(payload.data.saved);
  }
  return (
    <button type="button" onClick={toggle} className="btn btn-line h-11" aria-pressed={saved}>
      <Heart size={16} strokeWidth={1.5} fill={saved ? 'currentColor' : 'none'} />
      {saved ? 'В избранном' : 'В избранное'}
    </button>
  );
}
