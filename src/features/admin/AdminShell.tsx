import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { LayoutDashboard, LogOut, Puzzle, Users } from 'lucide-react';
import { useEffect } from 'react';
import type { ComponentType } from 'react';
import { clearAdminSession, getAdminSession } from '@/lib/adminAuth';
import { adminRootQuery, defaultUserSearch } from '@/lib/adminQueries';
import { queryClient } from '@/lib/queryClient';
import { initTheme } from '@/lib/theme';

type AdminNavLink = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  to: '/admin' | '/admin/users' | '/admin/plugins';
};

const navLinks: AdminNavLink[] = [
  { icon: LayoutDashboard, label: '概览', to: '/admin' },
  { icon: Users, label: '用户', to: '/admin/users' },
  { icon: Puzzle, label: '插件', to: '/admin/plugins' },
];

export function AdminShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const locked = getAdminSession()?.forceChangePassword ?? false;

  useEffect(() => {
    initTheme();
  }, []);

  function logout() {
    clearAdminSession();
    queryClient.removeQueries({ queryKey: adminRootQuery.queryKey });
    void navigate({ to: '/admin/login', search: { changed: false } });
  }

  return (
    <div className="flex h-screen flex-col bg-app-bg text-text lg:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-border-subtle bg-surface px-4 py-4 lg:w-56 lg:border-r lg:border-b-0 lg:px-3 lg:py-6">
        <div className="px-3">
          <p className="text-lg font-semibold">故桌管理</p>
          <p className="text-xs text-text-muted">操作员控制台</p>
        </div>
        <nav className="mt-4 flex gap-2 overflow-auto lg:mt-6 lg:flex-col" aria-label="管理导航">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              search={link.to === '/admin/users' ? defaultUserSearch : undefined}
              activeOptions={{ exact: link.to === '/admin' }}
              aria-disabled={locked}
              tabIndex={locked ? -1 : undefined}
              className={[
                'flex h-10 items-center gap-2 rounded-card px-3 text-base text-text hover:bg-surface-muted [&.active]:bg-surface-muted [&.active]:font-semibold [&.active]:text-accent',
                locked ? 'pointer-events-none opacity-40' : '',
              ].join(' ')}
              aria-label={link.label}
            >
              <link.icon className="size-5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
              <span className="whitespace-nowrap">{link.label}</span>
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="mt-3 flex h-10 items-center gap-2 rounded-card px-3 text-base text-text hover:bg-surface-muted lg:mt-auto"
        >
          <LogOut className="size-5" strokeWidth={2.2} aria-hidden="true" />
          退出
        </button>
      </aside>
      <main className="scroll-subtle-native-hidden min-w-0 flex-1 overflow-auto px-6 py-8 lg:px-8">
        {locked && pathname !== '/admin/password' ? null : <Outlet />}
      </main>
    </div>
  );
}
