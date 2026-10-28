import { Link } from '@tanstack/react-router';
import { BookOpen, Home, Images, MessageCircle, Settings, UserRound } from 'lucide-react';
import type { ComponentType } from 'react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';

export type AppNavLink = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  to: '/' | '/characters' | '/modules' | '/assets' | '/message' | '/settings';
};

export const navLinks: AppNavLink[] = [
  { icon: Home, label: '主页', to: '/' },
  { icon: BookOpen, label: '我的模组', to: '/modules' },
  { icon: UserRound, label: '我的角色', to: '/characters' },
  { icon: Images, label: '我的素材', to: '/assets' },
  { icon: MessageCircle, label: '消息', to: '/message' },
  { icon: Settings, label: '设置', to: '/settings' },
];

export const mobileLinks = navLinks.filter(({ to }) =>
  ['/', '/characters', '/modules', '/assets', '/settings'].includes(to),
);

export function RailIdentity({
  compact,
  user,
}: {
  compact: boolean;
  user?: { nickname?: string; username?: string; avatar?: string };
}) {
  return (
    <Link
      to="/settings"
      search={{ section: 'profile' }}
      className={[
        'mt-4 grid h-12 cursor-pointer items-center overflow-hidden rounded-card transition-[width] duration-300 ease-out hover:bg-surface-muted',
        compact ? 'w-11' : 'w-full',
        compact ? 'grid-cols-[44px_0px]' : 'grid-cols-[44px_minmax(0,1fr)] gap-3',
      ].join(' ')}
      aria-label="前往设置"
      title="前往设置"
    >
      <span className="grid size-11 place-items-center">
        <Avatar className="size-9 border border-border">
          <AvatarImage src={user?.avatar || '/avatar.webp'} alt="用户头像" />
        </Avatar>
      </span>
      <span
        className={[
          'overflow-hidden whitespace-nowrap text-left transition-opacity duration-150',
          compact ? 'opacity-0 w-0' : 'opacity-100 delay-150 w-auto',
        ].join(' ')}
      >
        <span className="block truncate text-sm font-medium">{user?.nickname}</span>
        <span className="block truncate text-xs text-text-muted">@{user?.username}</span>
      </span>
    </Link>
  );
}

export function RailLink({
  compact = false,
  icon: Icon,
  label,
  to,
}: AppNavLink & { compact?: boolean }) {
  return (
    <Link
      to={to}
      preload="intent"
      className={[
        'group grid h-10 items-center overflow-hidden rounded-card text-base font-normal tracking-normal text-text transition-colors duration-200 hover:bg-surface-muted hover:text-accent [&.active]:bg-surface-muted [&.active]:font-semibold [&.active]:text-accent',
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

export function MobileLink({ icon: Icon, label, to }: AppNavLink) {
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
