export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-lunea-blush ${className}`} aria-hidden="true" />;
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="border border-lunea-line bg-white px-6 py-16 text-center">
      <p className="font-display text-3xl tracking-tight">{title}</p>
      {text ? <p className="mx-auto mt-3 max-w-sm text-sm text-lunea-muted">{text}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ text = 'Не удалось загрузить данные.', onRetry }) {
  return (
    <div className="border border-lunea-line bg-white px-6 py-12 text-center" role="alert">
      <p className="font-display text-2xl">{text}</p>
      {onRetry ? <button className="btn mt-6" type="button" onClick={onRetry}>Повторить</button> : null}
    </div>
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-lunea-accent">{children}</p>;
}
