import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import type { SpaceCardLayout } from '@/lib/spaceCardLayout';
import type { SpaceListItem } from '../model/types';
import { SpaceQuickActionsMenu } from './SpaceQuickActionsMenu';

function picsum(seed: string, width = 40, height = width) {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

export function SpaceCard({
  space,
  layoutHash,
  cardLayout,
  fallbackLandscape,
  pinned,
  onTogglePin,
}: {
  space: SpaceListItem;
  layoutHash: number;
  cardLayout: SpaceCardLayout;
  fallbackLandscape: boolean;
  pinned: boolean;
  onTogglePin: () => void;
}) {
  const navigate = useNavigate();
  const [coverOrientation, setCoverOrientation] = useState<{
    url: string;
    isLandscape: boolean;
  } | null>(null);
  const memberCount = space.memberCount ?? 0;
  const fallbackIsLandscape = cardLayout === 'mixed' && !space.avatar && fallbackLandscape;
  const coverUrl =
    space.avatar ??
    picsum(
      space.spaceId ?? 'space',
      fallbackIsLandscape ? 960 : 640,
      fallbackIsLandscape ? 640 : 960,
    );
  const isLandscape =
    cardLayout === 'mixed' &&
    (coverOrientation?.url === coverUrl ? coverOrientation.isLandscape : fallbackIsLandscape);
  const cardAspect = (
    isLandscape
      ? ['aspect-[16/9]', 'aspect-[3/2]', 'aspect-[4/3]']
      : ['aspect-[2/3]', 'aspect-[3/5]', 'aspect-[5/8]']
  )[Math.floor(layoutHash / 2) % 3];
  const cardWidth = isLandscape
    ? 'w-full min-[600px]:w-[calc((200%_-_24px)/3)] min-[720px]:w-[calc((200%_-_48px)/4)] min-[900px]:w-[calc((200%_-_72px)/5)]'
    : 'w-full min-[480px]:w-[calc((100%_-_24px)/2)] min-[600px]:w-[calc((100%_-_48px)/3)] min-[720px]:w-[calc((100%_-_72px)/4)] min-[900px]:w-[calc((100%_-_96px)/5)]';

  function enter() {
    if (!space.spaceId) return;
    void navigate({ to: '/spaces/$spaceId', params: { spaceId: space.spaceId } });
  }

  return (
    <article
      data-space-card
      role="link"
      tabIndex={0}
      onClick={() => enter()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target === event.currentTarget) {
          event.preventDefault();
          enter();
        }
      }}
      className={`group relative mb-6 cursor-pointer overflow-hidden rounded-home-card border border-border-subtle bg-surface transition duration-300 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${cardWidth} ${cardAspect}`}
    >
      <img
        src={coverUrl}
        alt={space.name ?? '空间封面'}
        loading="lazy"
        onLoad={(event) => {
          setCoverOrientation({
            url: coverUrl,
            isLandscape: event.currentTarget.naturalWidth > event.currentTarget.naturalHeight,
          });
        }}
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-app-bg/40" />

      <SpaceQuickActionsMenu pinned={pinned} onTogglePin={onTogglePin} />

      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-app-bg via-app-bg/75 to-transparent px-4 pb-4 pt-24">
        <div className="flex items-center gap-1.5">
          <h2 className="min-w-0 truncate text-xl font-semibold text-text">
            {space.name ?? '未命名空间'}
          </h2>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
          {space.description || '暂无简介'}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {Array.from({ length: Math.min(4, memberCount) }, (_, i) => (
              <Avatar key={i} className="size-6 ring-2 ring-app-bg">
                <AvatarImage src={picsum(`${space.spaceId}_m${i}`, 24)} alt="" />
              </Avatar>
            ))}
            {memberCount > 4 && (
              <div className="flex size-6 items-center justify-center rounded-full bg-surface-muted text-2xs font-medium text-text-muted ring-2 ring-app-bg">
                +{memberCount - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-text-muted">{memberCount} 人</span>
        </div>
      </div>
    </article>
  );
}
