export function SpacesGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex h-40 animate-pulse overflow-hidden rounded-card border border-border-subtle bg-surface"
        >
          <div className="w-[132px] shrink-0 bg-surface-muted" />
          <div className="flex-1 space-y-2 p-4">
            <div className="h-3 w-1/2 rounded bg-surface-muted" />
            <div className="h-2.5 w-full rounded bg-surface-muted opacity-60" />
            <div className="h-2.5 w-5/6 rounded bg-surface-muted opacity-60" />
          </div>
        </div>
      ))}
    </div>
  );
}
