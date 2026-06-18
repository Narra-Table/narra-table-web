import { createFileRoute } from '@tanstack/react-router';
import { ChevronRight, MoreHorizontal, Plus, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { useSpacesQuery } from '@/features/spaces/queries';
import type { SpaceSummary } from '@/types/protocol';

// ── Static right-panel data ───────────────────────────────────────────────────

const RECENT_CHARACTERS = [
  { id: '1', name: '铃木·空', seed: 'suzuki' },
  { id: '2', name: '艾琳娜·夜蒿', seed: 'airina' },
  { id: '3', name: '陆离', seed: 'luli' },
  { id: '4', name: '卡尔', seed: 'karl' },
  { id: '5', name: '林小满', seed: 'linxm' },
] as const;

const RECENT_ASSETS = [
  { id: '1', name: '旧图书馆地图', date: '2026.3.19', seed: 'library_map' },
  { id: '2', name: '神秘符文纹理', date: '2026.3.18', seed: 'rune_texture' },
  { id: '3', name: '复古信纸套装', date: '2026.3.17', seed: 'vintage_paper' },
  { id: '4', name: '怪物图鉴：下层生物', date: '2026.3.16', seed: 'monster_book' },
  { id: '5', name: '蒸汽朋克UI组件', date: '2026.3.14', seed: 'steampunk_ui' },
] as const;

const DICE_BOTS = [
  { id: '1', name: '小骰', seed: 'dicebot1' },
  { id: '2', name: '艾莉丝', seed: 'dicebot2' },
  { id: '3', name: '雷娜', seed: 'dicebot3' },
  { id: '4', name: '绫音', seed: 'dicebot4' },
  { id: '5', name: '星野梦', seed: 'dicebot5' },
] as const;

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

function SpaceCard({ space }: { space: SpaceSummary }) {
  return (
    <article className="group flex min-h-[138px] cursor-pointer overflow-hidden rounded-card border border-border-subtle bg-surface transition-colors duration-200 hover:bg-surface-muted">
      {/* Cover */}
      <div className="relative w-[138px] shrink-0 self-stretch overflow-hidden bg-surface-muted">
        <img
          src={space.avatar ?? picsum(space.spaceId, 200)}
          alt={space.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-3 py-2">
        {/* Title row */}
        <div className="flex items-center gap-1.5">
          <span className="min-w-0 truncate text-lg font-semibold text-text">{space.name}</span>
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
            {Array.from({ length: Math.min(4, space.memberCount) }, (_, i) => (
              <Avatar key={i} className="size-6 ring-2 ring-surface">
                <AvatarImage src={picsum(`${space.spaceId}_m${i}`, 24)} />
              </Avatar>
            ))}
            {space.memberCount > 4 && (
              <div className="flex size-6 items-center justify-center rounded-full bg-surface-muted text-2xs font-medium text-text-muted ring-2 ring-surface">
                +{space.memberCount - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-text-muted">
            {space.memberCount}/{Math.max(6, space.memberCount)}
            {space.memberCount >= 6 && <span className="ml-1 opacity-60">（已满）</span>}
          </span>
        </div>
      </div>
    </article>
  );
}

// ── Right-panel sections ──────────────────────────────────────────────────────

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <button
          type="button"
          className="flex items-center gap-0.5 text-xs text-accent hover:opacity-80"
        >
          查看全部
          <ChevronRight className="size-3.5" />
        </button>
      </div>
      {children}
    </section>
  );
}

function RecentCharacters() {
  const { listRef, visibleCount } = useVisiblePanelItems(RECENT_CHARACTERS.length);

  return (
    <PanelSection title="最近编辑的角色">
      <ul ref={listRef} className="flex flex-1 flex-col gap-3 overflow-hidden">
        {RECENT_CHARACTERS.slice(0, visibleCount).map((char) => (
          <li key={char.id} className="flex items-center gap-3">
            <Avatar className="size-10 shrink-0 ring-1 ring-border">
              <AvatarImage src={picsum(char.seed, 80)} alt={char.name} />
            </Avatar>
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-text">{char.name}</p>
          </li>
        ))}
      </ul>
    </PanelSection>
  );
}

function RecentAssets() {
  const { listRef, visibleCount } = useVisiblePanelItems(RECENT_ASSETS.length);

  return (
    <PanelSection title="最新上传的素材">
      <ul ref={listRef} className="flex flex-1 flex-col gap-3 overflow-hidden">
        {RECENT_ASSETS.slice(0, visibleCount).map((asset) => (
          <li key={asset.id} className="flex items-center gap-3">
            <Avatar className="size-10 shrink-0 rounded-thumb ring-1 ring-border">
              <AvatarImage src={picsum(asset.seed, 80)} alt={asset.name} />
            </Avatar>
            <p className="min-w-0 flex-1 truncate text-sm text-text">{asset.name}</p>
          </li>
        ))}
      </ul>
    </PanelSection>
  );
}

function MyDiceBots() {
  return (
    <PanelSection title="我的骰娘">
      <div className="flex flex-wrap gap-5">
        {DICE_BOTS.slice(0, 3).map((bot) => (
          <div key={bot.id} className="flex flex-col items-center gap-1.5">
            <Avatar className="size-12 ring-2 ring-accent/30 transition-all hover:ring-accent/60">
              <AvatarImage src={picsum(bot.seed, 120)} alt={bot.name} />
            </Avatar>
            <span className="text-xs font-medium text-text">{bot.name}</span>
          </div>
        ))}
      </div>
    </PanelSection>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function DashboardPage() {
  const { data: spaces = [], isLoading } = useSpacesQuery();

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
            {spaces.map((space) => (
              <SpaceCard key={space.spaceId} space={space} />
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
