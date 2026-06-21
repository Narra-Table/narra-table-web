import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useGetApiSpacesSpaceIdMasks, useGetApiSpacesSpaceIdResources } from '@/api';
import type {
  getApiSpacesSpaceIdMasksResponseSuccess,
  getApiSpacesSpaceIdResourcesResponseSuccess,
} from '@/api';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { useVisiblePanelItems } from './useVisiblePanelItems';

// No cross-space endpoint exists yet; any spaceId is valid in mock mode.
const MOCK_SPACE_ID = '__dashboard__';

function picsum(seed: string, size = 40) {
  return `https://picsum.photos/seed/${seed}/${size}`;
}

function PanelSection({
  title,
  actionLabel = '查看全部',
  children,
}: {
  title: string;
  actionLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-0.5 text-xs text-accent hover:opacity-80"
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
                <AvatarImage src={picsum(mask.maskId ?? 'mask', 80)} alt="" />
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
                <AvatarImage src={picsum(resource.resourceId ?? 'res', 80)} alt="" />
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
                <AvatarImage src={picsum(bot.maskId ?? 'bot', 120)} alt="" />
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

export function DashboardRightPanel() {
  return (
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
  );
}
