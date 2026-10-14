import { Link, Outlet } from '@tanstack/react-router';

export function RoomLayout() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-app-bg text-text">
      <header className="flex h-14 shrink-0 items-center border-b border-border-subtle bg-surface px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            to="/"
            preload="intent"
            className="rounded-control px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
          >
            返回
          </Link>
          <h1 className="truncate text-sm font-semibold text-text">跑团工作区</h1>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
