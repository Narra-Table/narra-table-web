import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { initTheme } from '@/lib/theme';

const RoomLayout = () => {
  useEffect(() => {
    initTheme();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-text">
      <header className="flex h-14 items-center border-b border-border-subtle bg-surface px-4">
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

      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export const Route = createFileRoute('/_room')({
  component: RoomLayout,
});
