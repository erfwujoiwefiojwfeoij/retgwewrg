'use client';

import { usePathname } from 'next/navigation';

export default function PageEnter({ children }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
