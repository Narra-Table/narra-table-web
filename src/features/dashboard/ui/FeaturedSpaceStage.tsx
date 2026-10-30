import { useNavigate } from '@tanstack/react-router';
import { ArrowUpRight, Clock3, UsersRound } from 'lucide-react';
import type { SpaceListItem } from '../model/types';

function picsum(seed: string) {
  return `https://picsum.photos/seed/${seed}/1200/720`;
}

function formatLastActive(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(date);
}

export function FeaturedSpaceStage({ space }: { space: SpaceListItem }) {
  const navigate = useNavigate();
  const lastActive = formatLastActive(space.lastActiveAt);

  function enterSpace() {
    if (!space.spaceId) return;
    void navigate({ to: '/spaces/$spaceId', params: { spaceId: space.spaceId } });
  }

  return (
    <section className="group relative isolate min-h-72 overflow-hidden rounded-home-card border border-border-subtle bg-surface shadow-xl shadow-app-bg/40">
      <img
        src={space.avatar ?? picsum(space.spaceId)}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-app-bg via-app-bg/80 to-transparent" />
      <div className="absolute -right-16 -top-20 -z-10 size-72 rounded-full bg-accent/15 blur-3xl" />

      <div className="flex min-h-72 max-w-2xl flex-col justify-end px-6 py-10 sm:px-8 sm:py-12">
        <h2 className="max-w-xl text-3xl font-bold leading-tight text-text">{space.name}</h2>
        {space.description ? (
          <p className="mt-3 line-clamp-2 max-w-xl text-base leading-relaxed text-text-muted">
            {space.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <UsersRound className="size-4 text-accent" />
            {space.memberCount} 人
          </span>
          {lastActive ? (
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-4 text-accent" />
              {lastActive}
            </span>
          ) : null}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={enterSpace}
            className="inline-flex items-center gap-2 rounded-control bg-accent px-5 py-2.5 text-sm font-semibold text-accent-text transition duration-200 hover:brightness-110 active:scale-95"
          >
            进入空间
            <ArrowUpRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
