import { Outlet, useLocation } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGetApiMe } from '@/api';
import type { getApiMeResponseSuccess } from '@/api';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { initTheme } from '@/lib/appTheme';
import { MobileLink, mobileLinks, navLinks, RailIdentity, RailLink } from './navigation';

export function AppLayout() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentPageTitle =
    navLinks.find((link) => pathname === link.to || pathname.startsWith(`${link.to}/`))?.label ??
    'NarraTable';
  const { data: user } = useGetApiMe({
    query: { select: (res) => (res as getApiMeResponseSuccess).data },
  });

  useEffect(() => {
    initTheme();
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
            className="mb-3 grid size-11 shrink-0 place-items-center rounded-card transition-colors duration-200 hover:bg-surface-muted"
            aria-label={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
            title={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {isCollapsed ? (
              <ChevronRight className="icon-stroke size-5" aria-hidden="true" />
            ) : (
              <ChevronLeft className="icon-stroke size-5" aria-hidden="true" />
            )}
          </button>

          <nav className="flex flex-1 flex-col gap-2" aria-label="主导航">
            {navLinks.map((link) => (
              <RailLink key={`${link.to}-${link.label}`} compact={isCollapsed} {...link} />
            ))}
          </nav>

          <RailIdentity compact={isCollapsed} user={user} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-border-subtle bg-surface px-4 lg:hidden">
            <div>
              <p className="text-sm font-medium">{currentPageTitle}</p>
            </div>
            <Avatar className="size-9">
              <AvatarImage src={user?.avatar || '/avatar.webp'} alt="用户头像" />
            </Avatar>
          </header>

          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
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
    </div>
  );
}
