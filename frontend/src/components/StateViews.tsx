export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] w-full rounded-sm bg-surface" />
          <div className="mt-2 h-3 w-3/4 rounded-sm bg-surface" />
          <div className="mt-1.5 h-2.5 w-1/2 rounded-sm bg-surface" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-rule py-16 text-center">
      <p className="font-display text-lg text-parchment">{title}</p>
      <p className="mx-auto mt-2 max-w-prose text-sm text-muted">{body}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="border border-rule bg-surface py-16 text-center">
      <p className="font-display text-lg text-parchment">Something didn't load</p>
      <p className="mx-auto mt-2 max-w-prose text-sm text-muted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 border border-gold px-4 py-1.5 text-sm text-gold hover:bg-gold hover:text-ink"
        >
          Try again
        </button>
      )}
    </div>
  );
}
