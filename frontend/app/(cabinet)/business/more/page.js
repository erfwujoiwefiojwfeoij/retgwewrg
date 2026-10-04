'use client';

import Link from 'next/link';
import { Gate } from '@/components/business/WorkspaceGate';
import { businessNav } from '@/components/business/nav';

const skip = new Set(['/business/dashboard', '/business/calendar', '/business/appointments', '/business/more']);

export default function Page() {
  const links = businessNav.filter((item) => !skip.has(item.href));
  return (
    <Gate>
      {() => (
        <div className="grid gap-2 sm:grid-cols-2">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-[28px] border border-lunea-line bg-white px-4 py-4">
                <Icon className="h-4 w-4 text-lunea-accent" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </Gate>
  );
}
