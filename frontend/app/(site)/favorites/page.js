'use client';

import FavoritesList from '@/components/account/FavoritesList';

export default function Page() {
  return (
    <div className="page pb-20 pt-28">
      <h1 className="display text-5xl">Избранное</h1>
      <div className="mt-8"><FavoritesList /></div>
    </div>
  );
}
