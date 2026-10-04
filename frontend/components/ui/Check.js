'use client';

export default function Check({ checked, onChange, className = '' }) {
  return (
    <span className={`relative inline-flex h-5 w-5 shrink-0 ${className}`}>
      <input
        type="checkbox"
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
        checked={!!checked}
        onChange={onChange}
      />
      <span
        aria-hidden
        className="grid h-5 w-5 place-items-center rounded-full border border-lunea-line bg-white text-transparent transition duration-200 peer-checked:border-lunea-accent peer-checked:bg-lunea-accent peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-lunea-pink"
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
        </svg>
      </span>
    </span>
  );
}
