import { Plus } from 'lucide-react';
import Masonry from 'masonry-layout';
import { useEffect, useRef, useState } from 'react';
import { useGetApiSpaces } from '@/api';
import { useMediaQuery } from '@/lib/responsive';
import { getStoredSpaceCardLayout } from '@/lib/spaceCardLayout';
import { sortSpacesByPin, togglePinnedSpace, usePinnedSpaceIds } from '../model/pinnedSpaces';
import type { SpaceListItem } from '../model/types';
import { CreateSpaceDialog } from './dialogs';
import { FeaturedSpaceStage } from './FeaturedSpaceStage';
import { SpaceCard } from './SpaceCard';
import { SpacesGridSkeleton } from './SpacesGridSkeleton';

function hashString(value: string) {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export function SpacesContent() {
  const [creating, setCreating] = useState(false);
  const [cardLayout] = useState(getStoredSpaceCardLayout);
  const masonryRef = useRef<HTMLDivElement>(null);
  const compact = useMediaQuery('compact');
  const pinnedIds = usePinnedSpaceIds();
  const { data: spaces = [], isLoading } = useGetApiSpaces({
    query: {
      select: (res) => (res.data.spaces ?? []) as SpaceListItem[],
    },
  });
  const visibleSpaces = sortSpacesByPin(
    spaces.filter((space) => space.status !== 'archived'),
    pinnedIds,
  );
  const listedSpaces = compact ? visibleSpaces : visibleSpaces.slice(1);
  const masonryItemsKey = `${compact ? 'compact' : 'desktop'}:${cardLayout}:${listedSpaces
    .map((space) => space.spaceId ?? '')
    .join('|')}`;
  const spaceLayouts = listedSpaces.map((space, index) => {
    const layoutKey = space.spaceId ?? space.name ?? String(index);
    return { space, index, layoutKey, layoutHash: hashString(layoutKey) };
  });
  const placeholderLayouts =
    cardLayout === 'mixed'
      ? spaceLayouts
          .filter(({ space }) => !space.avatar)
          .toSorted((a, b) => a.layoutHash - b.layoutHash || a.index - b.index)
      : [];
  const landscapePlaceholderKeys = new Set(
    placeholderLayouts
      .slice(0, Math.round(placeholderLayouts.length / 2))
      .map(({ layoutKey }) => layoutKey),
  );

  useEffect(() => {
    const container = masonryRef.current;
    if (!container || listedSpaces.length === 0) return;

    const masonry = new Masonry(container, {
      itemSelector: '[data-space-card]',
      columnWidth: '[data-space-sizer]',
      gutter: 24,
      horizontalOrder: true,
      transitionDuration: 0,
    });
    const resizeObserver = new ResizeObserver(() => masonry.layout?.());

    container.querySelectorAll('[data-space-card]').forEach((card) => resizeObserver.observe(card));

    return () => {
      resizeObserver.disconnect();
      masonry.destroy?.();
    };
  }, [listedSpaces.length, masonryItemsKey]);

  const spaceCards = spaceLayouts.map(({ space, index, layoutKey, layoutHash }) => (
    <SpaceCard
      key={space.spaceId ?? index}
      space={space}
      layoutHash={layoutHash}
      cardLayout={cardLayout}
      fallbackLandscape={landscapePlaceholderKeys.has(layoutKey)}
      pinned={Boolean(space.spaceId && pinnedIds.includes(space.spaceId))}
      onTogglePin={() => {
        if (space.spaceId) togglePinnedSpace(space.spaceId);
      }}
    />
  ));

  return (
    <div className="scroll-subtle-native-hidden flex-1 overflow-y-auto p-8 ">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">空间</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-card bg-accent px-5 py-2.5 text-sm font-semibold text-accent-text shadow-lg transition-all hover:opacity-90 active:scale-95"
          >
            <Plus className="icon-stroke size-4" />
            创建空间
          </button>
        </div>
      </div>

      {isLoading ? (
        <SpacesGridSkeleton showFeatured={!compact} />
      ) : (
        <>
          {!compact && visibleSpaces[0] ? (
            <div className="mb-8">
              <FeaturedSpaceStage
                space={visibleSpaces[0]}
                pinned={pinnedIds.includes(visibleSpaces[0].spaceId)}
                onTogglePin={() => togglePinnedSpace(visibleSpaces[0].spaceId)}
              />
            </div>
          ) : null}

          {listedSpaces.length > 0 ? (
            <div ref={masonryRef} className="relative">
              <div
                data-space-sizer
                aria-hidden="true"
                className="w-full min-[480px]:w-[calc((100%-24px)/2)] min-[600px]:w-[calc((100%-48px)/3)] min-[720px]:w-[calc((100%-72px)/4)] min-[900px]:w-[calc((100%-96px)/5)]"
              />
              {spaceCards}
            </div>
          ) : null}
        </>
      )}

      {!isLoading && visibleSpaces.length === 0 && (
        <div className="mt-20 flex flex-col items-center justify-center text-text-muted">
          <p className="text-base">还没有任何空间</p>
          <p className="text-sm">点击「创建空间」开始你的第一次跑团吧！</p>
        </div>
      )}
      {creating ? <CreateSpaceDialog onClose={() => setCreating(false)} /> : null}
    </div>
  );
}
