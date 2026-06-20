import { createFileRoute } from '@tanstack/react-router';
import { ChevronRight, MoreHorizontal, Plus, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  useGetApiSpaces,
  useGetApiSpacesSpaceIdMasks,
  useGetApiSpacesSpaceIdResources,
} from '@/api';
import type {
  getApiSpacesSpaceIdMasksResponseSuccess,
  getApiSpacesSpaceIdResourcesResponseSuccess,
} from '@/api';
import type { InternalHandlerSpaceSummary } from '@/api/model';
import { Avatar, AvatarImage } from '@/components/ui/avatar';

// API 生成类型尚未包含 avatar/description，在此扩展
type SpaceListItem = InternalHandlerSpaceSummary & {
  avatar?: string;
  description?: string;
};

// ── Right-panel mock space ID ─────────────────────────────────────────────────
// No cross-space endpoint exists yet; any spaceId is valid in mock mode.
const MOCK_SPACE_ID = '__dashboard__';

// ── Helpers ───────────────────────────────────────────────────────────────────

function picsum(seed: string, size = 40) {
  return `https://picsum.photos/seed/${seed}/${size}`;
}

function useVisiblePanelItems(itemCount: number) {
  const listRef = useRef<HTMLUListElement>(null);
  const [visibleCount, setVisibleCount] = useState(itemCount);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const updateVisibleCount = () => {
      const itemHeight = 40;
      const gap = 12;
      const nextVisibleCount = Math.floor((list.clientHeight + gap) / (itemHeight + gap));
      setVisibleCount(Math.min(itemCount, Math.max(1, nextVisibleCount)));
    };

    updateVisibleCount();
    const resizeObserver = new ResizeObserver(updateVisibleCount);
    resizeObserver.observe(list);

    return () => resizeObserver.disconnect();
  }, [itemCount]);

  return { listRef, visibleCount };
}

// ── SpaceCard ─────────────────────────────────────────────────────────────────

function SpaceCard({ space }: { space: SpaceListItem }) {
  const memberCount = space.memberCount ?? 0;

  return (
    <article className="group flex min-h-[138px] cursor-pointer overflow-hidden rounded-card border border-border-subtle bg-surface transition-colors duration-200 hover:bg-surface-muted">
      {/* Cover */}
      <div className="relative w-[138px] shrink-0 self-stretch overflow-hidden bg-surface-muted">
        <img
          src={space.avatar ?? picsum(space.spaceId ?? 'space', 200)}
          alt={space.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-3 py-2">
        {/* Title row */}
        <div className="flex items-center gap-1.5">
          <span className="min-w-0 truncate text-lg font-semibold text-text">
            {space.name ?? '未命名空间'}
          </span>
          <button
            type="button"
            className="ml-auto shrink-0 rounded-thumb p-0.5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-text"
            aria-label="更多操作"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>

        {/* Description */}
        <p className="line-clamp-3 text-sm leading-snug text-text-muted">
          {space.description ?? '暂无简介'}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <div className="flex -space-x-1.5">
            {Array.from({ length: Math.min(4, memberCount) }, (_, i) => (
              <Avatar key={i} className="size-6 ring-2 ring-surface">
                <AvatarImage src={picsum(`${space.spaceId}_m${i}`, 24)} />
              </Avatar>
            ))}
            {memberCount > 4 && (
              <div className="flex size-6 items-center justify-center rounded-full bg-surface-muted text-2xs font-medium text-text-muted ring-2 ring-surface">
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

// ── Right-panel sections ──────────────────────────────────────────────────────

function PanelSection({
  title,
  actionLabel = '查看全部',
  children,
}: {
  title: string;
  actionLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <button
          type="button"
          className="flex items-center gap-0.5 text-xs text-accent hover:opacity-80"
        >
          {actionLabel}
          <ChevronRight className="size-3.5" />
        </button>
      </div>
      {children}
    </section>
  );
}

function RecentCharacters() {
  const { listRef, visibleCount } = useVisiblePanelItems(5);
  const { data: masks = [] } = useGetApiSpacesSpaceIdMasks(MOCK_SPACE_ID, {
    query: {
      select: (res) => {
        const list = (res as getApiSpacesSpaceIdMasksResponseSuccess).data.masks ?? [];
        return list
          .filter((m) => m.type !== 'system')
          .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
          .slice(0, 5);
      },
    },
  });

  return (
    <PanelSection title="最近编辑的角色" actionLabel={masks.length === 0 ? '去创建' : '查看全部'}>
      {masks.length === 0 ? (
        <p className="text-center text-xs text-text-muted">还没有任何角色</p>
      ) : (
        <ul ref={listRef} className="flex flex-1 flex-col gap-3 overflow-hidden">
          {masks.slice(0, visibleCount).map((mask, i) => (
            <li key={mask.maskId ?? i} className="flex items-center gap-3">
              <Avatar className="size-10 shrink-0 ring-1 ring-border">
                <AvatarImage src={picsum(mask.maskId ?? 'mask', 80)} alt={mask.name} />
              </Avatar>
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-text">
                {mask.name ?? '未命名角色'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PanelSection>
  );
}

function RecentAssets() {
  const { listRef, visibleCount } = useVisiblePanelItems(5);
  const { data: resources = [] } = useGetApiSpacesSpaceIdResources(MOCK_SPACE_ID, {
    query: {
      select: (res) => {
        const list = (res as getApiSpacesSpaceIdResourcesResponseSuccess).data.resources ?? [];
        return list
          .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
          .slice(0, 5);
      },
    },
  });

  return (
    <PanelSection
      title="最新上传的素材"
      actionLabel={resources.length === 0 ? '去上传' : '查看全部'}
    >
      {resources.length === 0 ? (
        <p className="text-center text-xs text-text-muted">还没有任何素材</p>
      ) : (
        <ul ref={listRef} className="flex flex-1 flex-col gap-3 overflow-hidden">
          {resources.slice(0, visibleCount).map((resource, i) => (
            <li key={resource.resourceId ?? i} className="flex items-center gap-3">
              <Avatar className="size-10 shrink-0 rounded-thumb ring-1 ring-border">
                <AvatarImage src={picsum(resource.resourceId ?? 'res', 80)} alt={resource.name} />
              </Avatar>
              <p className="min-w-0 flex-1 truncate text-sm text-text">
                {resource.name ?? '未命名素材'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PanelSection>
  );
}

function MyDiceBots() {
  const { data: bots = [] } = useGetApiSpacesSpaceIdMasks(MOCK_SPACE_ID, {
    query: {
      select: (res) => {
        const list = (res as getApiSpacesSpaceIdMasksResponseSuccess).data.masks ?? [];
        return list
          .filter((m) => m.type === 'system')
          .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
          .slice(0, 3);
      },
    },
  });

  return (
    <PanelSection title="我的骰娘" actionLabel={bots.length === 0 ? '去添加' : '查看全部'}>
      {bots.length === 0 ? (
        <p className="text-center text-xs text-text-muted">还没有任何骰娘</p>
      ) : (
        <div className="flex flex-wrap gap-5">
          {bots.map((bot, i) => (
            <div key={bot.maskId ?? i} className="flex flex-col items-center gap-1.5">
              <Avatar className="size-12 ring-2 ring-accent/30 transition-all hover:ring-accent/60">
                <AvatarImage src={picsum(bot.maskId ?? 'bot', 120)} alt={bot.name} />
              </Avatar>
              <span className="w-12 truncate text-center text-xs font-medium text-text">
                {bot.name ?? '未命名'}
              </span>
            </div>
          ))}
        </div>
      )}
    </PanelSection>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function DashboardPage() {
  const { data: spaces = [], isLoading } = useGetApiSpaces({
    query: {
      select: (res) => (res.data.spaces ?? []) as SpaceListItem[],
    },
  });

  return (
    <div className="flex h-full bg-app-bg">
      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="scroll-subtle-native-hidden flex-1 overflow-y-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-text">空间</h1>
              <Sparkles className="size-4 text-accent" />
            </div>
            <p className="mt-1.5 text-base text-text-muted">你的所有故桌空间都在这里！</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-card bg-accent px-5 py-2.5 text-sm font-semibold text-accent-text shadow-lg transition-all hover:opacity-90 active:scale-95"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              创建空间
            </button>
          </div>
        </div>

        {/* Cards grid */}
        {isLoading ? (
          <SpacesGridSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {spaces.map((space, i) => (
              <SpaceCard key={space.spaceId ?? i} space={space} />
            ))}
          </div>
        )}

        {!isLoading && spaces.length > 0 && (
          <div className="mt-12 flex items-center justify-center text-text-muted">
            <p className="text-sm">没有更多了～</p>
          </div>
        )}

        {!isLoading && spaces.length === 0 && (
          <div className="mt-20 flex flex-col items-center justify-center text-text-muted">
            <p className="text-base">还没有任何空间</p>
            <p className="text-sm">点击「创建空间」开始你的第一次跑团吧！</p>
          </div>
        )}
      </div>

      {/* ── Right panel ──────────────────────────────────────────────────── */}
      <aside className="hidden w-[240px] shrink-0 border-l border-border-subtle bg-surface lg:flex lg:flex-col">
        <div className="flex flex-1 flex-col overflow-hidden border-b border-border-subtle px-6 py-4">
          <RecentCharacters />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden border-b border-border-subtle px-6 py-4">
          <RecentAssets />
        </div>
        <div className="flex shrink-0 flex-col px-6 py-5">
          <MyDiceBots />
        </div>
      </aside>
    </div>
  );
}

function SpacesGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex h-40 animate-pulse overflow-hidden rounded-card border border-border-subtle bg-surface"
        >
          <div className="w-[132px] shrink-0 bg-surface-muted" />
          <div className="flex-1 space-y-2 p-4">
            <div className="h-3 w-1/2 rounded bg-surface-muted" />
            <div className="h-2.5 w-full rounded bg-surface-muted opacity-60" />
            <div className="h-2.5 w-5/6 rounded bg-surface-muted opacity-60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const Route = createFileRoute('/_app/')({
  component: DashboardPage,
});
