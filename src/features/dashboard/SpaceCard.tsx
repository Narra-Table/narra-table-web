import { MoreHorizontal } from 'lucide-react';
import type { InternalHandlerSpaceSummary } from '@/api/model';
import { Avatar, AvatarImage } from '@/components/ui/avatar';

// API 生成类型尚未包含 avatar/description，在此扩展
export type SpaceListItem = InternalHandlerSpaceSummary & {
  avatar?: string;
  description?: string;
};

function picsum(seed: string, size = 40) {
  return `https://picsum.photos/seed/${seed}/${size}`;
}

export function SpaceCard({ space }: { space: SpaceListItem }) {
  const memberCount = space.memberCount ?? 0;

  return (
    <article className="group flex min-h-[138px] cursor-pointer overflow-hidden rounded-card border border-border-subtle bg-surface transition-colors duration-200 hover:bg-surface-muted">
      {/* Cover */}
      <div className="relative w-[138px] shrink-0 self-stretch overflow-hidden bg-surface-muted">
        <img
          src={space.avatar ?? picsum(space.spaceId ?? 'space', 200)}
          alt={space.name ?? '空间封面'}
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
