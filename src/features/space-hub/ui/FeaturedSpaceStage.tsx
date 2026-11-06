import { useNavigate } from '@tanstack/react-router';
import { ArrowUpRight, Clock, Users } from 'lucide-react';
import type { SpaceListItem } from '../model/types';
import { SpaceQuickActionsMenu } from './SpaceQuickActionsMenu';

function picsum(seed: string) {
  return `https://picsum.photos/seed/${seed}/1200/720`;
}

function formatLastActive(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(date);
}

export function FeaturedSpaceStage({
  space,
  pinned,
  onTogglePin,
}: {
  space: SpaceListItem;
  pinned: boolean;
  onTogglePin: () => void;
}) {
  const navigate = useNavigate();
  const lastActive = formatLastActive(space.lastActiveAt);

  function enterSpace() {
    if (!space.spaceId) return;
    void navigate({ to: '/spaces/$spaceId', params: { spaceId: space.spaceId } });
  }

  return (
    <section className="group relative isolate min-h-72 overflow-hidden rounded-home-card border border-border-subtle bg-surface shadow-xl shadow-app-bg/40">
      <SpaceQuickActionsMenu pinned={pinned} onTogglePin={onTogglePin} />
      <img
        src={space.avatar ?? picsum(space.spaceId)}
        alt=""
        className="absolute inset-0 -z-20 size-full  object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-app-bg via-app-bg/60 to-transparent" />
      <div className="absolute -right-16 -top-20 -z-10 size-72 bg-accent/15 blur-3xl" />

      <div className="flex min-h-72 max-w-2xl flex-col px-6 pt-8 pb-10 sm:px-8 sm:pt-10 sm:pb-12">
        <h2 className="max-w-xl text-3xl/tight font-bold  text-text">{space.name}</h2>
        <div className="mt-auto translate-y-5">
          {space.description ? (
            <p className="line-clamp-2 max-w-xl text-base/relaxed  text-text-muted">
              {space.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <Users className="icon-stroke size-4 text-accent" />
              {space.memberCount} 人
            </span>
            {lastActive ? (
              <span className="flex items-center gap-1.5">
                <Clock className="icon-stroke size-4 text-accent" />
                {lastActive}
              </span>
            ) : null}
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={enterSpace}
              className="inline-flex cursor-pointer items-center gap-2 rounded-control bg-accent px-5 py-2.5 text-sm font-semibold text-accent-text transition duration-200 hover:brightness-110 active:scale-95"
            >
              进入空间
              <ArrowUpRight className="icon-stroke size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
