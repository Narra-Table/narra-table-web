import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Home,
  Images,
  LogOut,
  MessageCircle,
  Settings,
  UserRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { createPortal } from 'react-dom';

type AppNavLink = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  to: '/' | '/characters' | '/modules' | '/assets' | '/notifications' | '/settings';
};

const navLinks: AppNavLink[] = [
  { icon: Home, label: '主页', to: '/' },
  { icon: BookOpen, label: '我的模组', to: '/modules' },
  { icon: UserRound, label: '我的角色', to: '/characters' },
  { icon: Images, label: '我的素材', to: '/assets' },
  { icon: MessageCircle, label: '消息', to: '/notifications' },
  { icon: Settings, label: '设置', to: '/settings' },
];

const mobileLinks = navLinks.filter(({ to }) =>
  ['/', '/characters', '/modules', '/assets', '/settings'].includes(to),
);

const AppLayout = () => {
  const pathname = useLocation({ select: (location) => location.pathname });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentPageTitle =
    navLinks.find((link) => pathname === link.to || pathname.startsWith(`${link.to}/`))?.label ??
    'Narra Table';

  useEffect(() => {
    const storedTheme = localStorage.getItem('narra-theme');
    const supportedThemes = ['warm', 'brown', 'pink', 'black-green', 'black-blue'];
    const nextTheme = storedTheme && supportedThemes.includes(storedTheme) ? storedTheme : 'warm';
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-app-bg text-text">
      <div className="flex h-full">
        <aside
          className={[
            'hidden shrink-0 overflow-hidden border-r border-border-subtle bg-surface px-3 py-6 text-text transition-[width] duration-300 ease-out lg:flex lg:flex-col',
            isCollapsed ? 'w-17' : 'w-46',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={() => setIsCollapsed((c) => !c)}
            className="mb-3 grid size-11 shrink-0 place-items-center rounded-2xl transition-colors duration-200 hover:bg-surface-muted"
            aria-label={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
            title={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {isCollapsed ? (
              <ChevronRight className="size-5" strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <ChevronLeft className="size-5" strokeWidth={2.2} aria-hidden="true" />
            )}
          </button>

          <nav className="flex flex-1 flex-col gap-2" aria-label="主导航">
            {navLinks.map((link) => (
              <RailLink key={`${link.to}-${link.label}`} compact={isCollapsed} {...link} />
            ))}
          </nav>

          <RailIdentity
            compact={isCollapsed}
            onClick={() => setIsProfileOpen((isOpen) => !isOpen)}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-border-subtle bg-surface px-4 lg:hidden">
            <div>
              <p className="text-sm font-medium">{currentPageTitle}</p>
            </div>
            <img src="/avatar.webp" alt="用户头像" className="size-9 rounded-full object-cover" />
          </header>

          <main className="min-w-0 flex-1 overflow-auto">
            <Outlet />
          </main>

          <nav
            className="grid grid-cols-5 border-t border-border-subtle bg-surface lg:hidden"
            aria-label="移动端导航"
          >
            {mobileLinks.map((link) => (
              <MobileLink key={`${link.to}-${link.label}`} {...link} />
            ))}
          </nav>
        </div>
      </div>
      {isProfileOpen && <ProfilePopover onClose={() => setIsProfileOpen(false)} />}
    </div>
  );
};

function RailIdentity({ compact, onClick }: { compact: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={[
        'mt-4 grid h-12 cursor-pointer items-center overflow-hidden rounded-card transition-[width] duration-300 ease-out hover:bg-surface-muted',
        compact ? 'w-11' : 'w-full',
        compact ? 'grid-cols-[44px_0px]' : 'grid-cols-[44px_minmax(0,1fr)] gap-3',
      ].join(' ')}
      aria-label="打开用户菜单"
      title="打开用户菜单"
      onClick={onClick}
    >
      <span className="grid size-11 place-items-center">
        <img
          src="/avatar.webp"
          alt="用户头像"
          className="size-9 rounded-full border border-border object-cover"
        />
      </span>
      <span
        className={[
          'overflow-hidden whitespace-nowrap text-left transition-opacity duration-150',
          compact ? 'opacity-0 w-0' : 'opacity-100 delay-150 w-auto',
        ].join(' ')}
      >
        <span className="block truncate text-sm font-medium">滩间铁_半拍</span>
        <span className="block truncate text-xs text-text-muted">@hanpai</span>
      </span>
    </button>
  );
}

function RailLink({ compact = false, icon: Icon, label, to }: AppNavLink & { compact?: boolean }) {
  return (
    <Link
      to={to}
      preload="intent"
      className={[
        'group grid h-10 items-center overflow-hidden rounded-2xl text-base font-normal tracking-normal text-text transition-colors duration-200 hover:bg-surface-muted hover:text-accent [&.active]:bg-surface-muted [&.active]:font-semibold [&.active]:text-accent',
        compact ? 'w-10 grid-cols-[40px_0px]' : 'w-full grid-cols-[40px_minmax(0,1fr)]',
      ].join(' ')}
      aria-label={label}
      title={compact ? label : undefined}
    >
      <span className="grid size-10 place-items-center">
        <Icon className="size-5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span
        className={[
          'overflow-hidden whitespace-nowrap transition-opacity duration-150',
          compact ? 'opacity-0 w-0' : 'opacity-100 delay-150 w-auto',
        ].join(' ')}
      >
        {label}
      </span>
    </Link>
  );
}

function MobileLink({ icon: Icon, label, to }: AppNavLink) {
  return (
    <Link
      to={to}
      preload="intent"
      className="flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-2xs font-medium text-text-muted [&.active]:text-accent"
      aria-label={label}
    >
      <Icon className="size-4" strokeWidth={2.4} aria-hidden="true" />
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

function ProfilePopover({ onClose }: { onClose: () => void }) {
  const modalRoot = typeof document === 'undefined' ? null : document.getElementById('modal-root');
  const content = (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute bottom-6 left-3 w-64 rounded-overlay border border-border bg-surface p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <img
            src="/avatar.webp"
            alt="用户头像"
            className="size-11 shrink-0 rounded-full border border-border object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">滩间铁_半拍</p>
            <p className="mt-0.5 truncate text-xs text-text-muted">@hanpai</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          <button className="rounded-card border border-border px-3 py-2 text-left text-sm hover:bg-surface-muted">
            个人中心
          </button>
          <button className="flex items-center gap-2 rounded-card border border-border px-3 py-2 text-left text-sm text-text-muted hover:bg-surface-muted">
            <LogOut className="size-4" aria-hidden="true" />
            登出
          </button>
        </div>
      </div>
    </div>
  );

  return modalRoot ? createPortal(content, modalRoot) : content;
}

export const Route = createFileRoute('/_app')({
  component: AppLayout,
});
