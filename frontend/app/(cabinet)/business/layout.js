'use client';

import Cabinet from '@/layouts/Cabinet';
import { businessNav } from '@/components/business/nav';

export default function Layout({ children }) {
  return <Cabinet title="Кабинет" items={businessNav}>{children}</Cabinet>;
}
