import { Plus, Sparkles } from 'lucide-react';
import { useGetApiSpaces } from '@/api';
import { SpaceCard } from './SpaceCard';
import type { SpaceListItem } from './SpaceCard';
import { SpacesGridSkeleton } from './SpacesGridSkeleton';

export function SpacesContent() {
  const { data: spaces = [], isLoading } = useGetApiSpaces({
    query: {
      select: (res) => (res.data.spaces ?? []) as SpaceListItem[],
    },
  });

  return (
    <div className="scroll-subtle-native-hidden flex-1 overflow-y-auto px-8 py-8">
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
            className="flex cursor-pointer items-center gap-1.5 rounded-card bg-accent px-5 py-2.5 text-sm font-semibold text-accent-text shadow-lg transition-all hover:opacity-90 active:scale-95"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            创建空间
          </button>
        </div>
      </div>

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
  );
}
