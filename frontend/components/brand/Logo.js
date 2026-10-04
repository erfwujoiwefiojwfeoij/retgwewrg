export function Mark({ className = 'h-7 w-7', tone = 'dark' }) {
  const ink = tone === 'light' ? '#FFF9FA' : '#241B1F';
  const accent = tone === 'light' ? '#F3C2D0' : '#D9688A';
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M23.2 8.2a9.2 9.2 0 1 0 1.4 10.8" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7.2 22.4c5.8 2.4 11.2-.4 15.6-6.2" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ tone = 'dark', compact = false, className = '' }) {
  const ink = tone === 'light' ? 'text-[#FFF9FA]' : 'text-lunea-dark';
  return (
    <span className={`inline-flex items-center gap-2.5 ${ink} ${className}`}>
      <Mark tone={tone} />
      {compact ? null : <span className="font-display text-[18px] tracking-[0.22em]">LUNEA</span>}
    </span>
  );
}
