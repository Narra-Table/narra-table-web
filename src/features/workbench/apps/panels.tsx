import { useState, type ReactNode } from 'react';
import {
  useGetApiSpacesSpaceId,
  useGetApiSpacesSpaceIdMasks,
  useGetApiSpacesSpaceIdRoomsRoomIdMessages,
  type getApiSpacesSpaceIdMasksResponseSuccess,
} from '@/api';
import type { GithubComNarraTableBackendPkgProtocolMask } from '@/api/model/githubComNarraTableBackendPkgProtocolMask';
import { useResourceUrl } from '@/features/room-chat/tiles/useResourceUrl';
import { cn } from '@/lib/utils';
import { MASK_SECTIONS, ROLE_LABEL } from './labels';

function PanelScroll({ children }: { children: ReactNode }) {
  return (
    <div className="scroll-subtle-native-hidden min-h-0 flex-1 overflow-y-auto px-3 py-3">
      {children}
    </div>
  );
}

export function MembersPanel({ spaceId }: { spaceId: string }) {
  const space = useGetApiSpacesSpaceId(spaceId, {
    query: { select: (response) => response.data },
  });
  const members = space.data?.members ?? [];
  return (
    <PanelScroll>
      {space.isLoading ? <p className="text-xs text-text-muted">正在读取成员</p> : null}
      {!space.isLoading && members.length === 0 ? (
        <p className="text-sm text-text-muted">还没有成员</p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {members.map((member) => (
          <li key={member.userId} className="flex items-center gap-3 rounded-control px-2 py-2">
            <span className="grid size-8 place-items-center rounded-full bg-surface-muted text-xs font-semibold text-text">
              {(member.displayName || '成').slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-text">
                {member.displayName || '未命名成员'}
              </span>
              <span className="block text-xs text-text-muted">
                {member.role ? ROLE_LABEL[member.role] : '成员'}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </PanelScroll>
  );
}

export function CharactersPanel({ spaceId }: { spaceId: string }) {
  const masks = useGetApiSpacesSpaceIdMasks(spaceId, {
    query: {
      select: (response) => (response as getApiSpacesSpaceIdMasksResponseSuccess).data.masks ?? [],
    },
  });
  const list = masks.data ?? [];
  return (
    <PanelScroll>
      {masks.isLoading ? <p className="text-xs text-text-muted">正在读取面具</p> : null}
      {!masks.isLoading && list.length === 0 ? (
        <p className="text-sm text-text-muted">还没有面具</p>
      ) : null}
      <div className="flex flex-col gap-4">
        {MASK_SECTIONS.map((section) => {
          const items = list.filter((mask) => mask.type === section.type);
          if (items.length === 0) return null;
          return (
            <section key={section.type} className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-text-muted">{section.label}</h3>
              {items.map((mask) => (
                <MaskRow key={mask.maskId} spaceId={spaceId} mask={mask} />
              ))}
            </section>
          );
        })}
      </div>
    </PanelScroll>
  );
}

function MaskRow({
  spaceId,
  mask,
}: {
  spaceId: string;
  mask: GithubComNarraTableBackendPkgProtocolMask;
}) {
  const resourceId = mask.currentAvatarId ? mask.avatars?.[mask.currentAvatarId] : undefined;
  const media = useResourceUrl(spaceId, resourceId);
  return (
    <div className="flex items-center gap-3 rounded-control px-2 py-2">
      <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-surface-muted text-xs font-semibold text-text">
        {media.url ? (
          <img src={media.url} alt="" className="size-full object-cover" />
        ) : (
          mask.name.slice(0, 1)
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">{mask.name}</span>
      {mask.isDefault ? <span className="text-xs text-accent">默认</span> : null}
    </div>
  );
}

export function CluesPanel({
  spaceId,
  roomId,
  onSeek,
}: {
  spaceId: string;
  roomId: string;
  onSeek: (text: string) => void;
}) {
  const history = useGetApiSpacesSpaceIdRoomsRoomIdMessages(
    spaceId,
    roomId,
    { limit: 50 },
    { query: { select: (response) => response.data.messages ?? [] } },
  );
  const clues = (history.data ?? []).filter((message) => message.type === 'clue' && message.clue);
  return (
    <div className="scroll-subtle-native-hidden flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
      <p className="text-xs text-text-muted">
        这里收的是已经加载的线索。点一条，聊天窗口会按标题筛出来。
      </p>
      {history.isLoading ? <p className="text-xs text-text-muted">正在读取线索</p> : null}
      {!history.isLoading && clues.length === 0 ? (
        <p className="text-sm text-text-muted">最近的记录里还没有线索卡片</p>
      ) : null}
      {clues.map((message) => (
        <button
          key={message.messageId}
          type="button"
          onClick={() => onSeek(message.clue?.title ?? '')}
          className="rounded-card border border-border-subtle bg-app-bg px-4 py-3 text-left transition-colors hover:bg-surface-muted"
        >
          <span className="block truncate text-sm font-semibold text-text">
            {message.clue?.title || '未命名线索'}
          </span>
          {message.clue?.description ? (
            <span className="mt-1 line-clamp-2 block text-xs text-text-muted">
              {message.clue.description}
            </span>
          ) : null}
          <span className="mt-2 block text-xs text-accent">
            {message.clue?.isDiscovered ? '已发现' : '未发现'}
          </span>
        </button>
      ))}
    </div>
  );
}

export function CombatPanel() {
  const [name, setName] = useState('');
  const [init, setInit] = useState('10');
  const [rows, setRows] = useState<{ id: string; name: string; init: number }[]>([]);
  const ordered = rows
    .slice()
    .sort((left, right) => right.init - left.init || left.name.localeCompare(right.name, 'zh'));

  return (
    <form
      className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        const value = Number(init);
        if (!trimmed || Number.isNaN(value)) return;
        setRows((current) => [...current, { id: `${Date.now()}`, name: trimmed, init: value }]);
        setName('');
      }}
    >
      <p className="text-xs text-text-muted">
        先把这一轮的先攻记在这里。切换房间或刷新后这份名单会清空。
      </p>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label="战斗单位"
          placeholder="名字"
          className="min-w-0 flex-1 rounded-control border border-border bg-app-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
        <input
          value={init}
          onChange={(event) => setInit(event.target.value)}
          aria-label="先攻"
          inputMode="numeric"
          className="w-16 rounded-control border border-border bg-app-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        className="rounded-control bg-accent px-4 py-2 text-sm font-semibold text-accent-text"
      >
        加入先攻
      </button>
      <ol className="scroll-subtle-native-hidden flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {ordered.length === 0 ? <li className="text-sm text-text-muted">先攻列表是空的</li> : null}
        {ordered.map((row, index) => (
          <li key={row.id} className="flex items-center gap-3 rounded-control bg-app-bg px-3 py-2">
            <span className="w-5 text-xs text-text-muted">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
              {row.name}
            </span>
            <span className="text-sm font-semibold text-accent">{row.init}</span>
            <button
              type="button"
              className="text-xs text-text-muted"
              onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
            >
              移除
            </button>
          </li>
        ))}
      </ol>
    </form>
  );
}

const MAP_COLS = 8;
const MAP_ROWS = 6;

export function MapPanel() {
  const [pins, setPins] = useState<Record<string, string>>({});
  const [label, setLabel] = useState('甲');
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-3">
      <div className="flex items-center gap-2">
        <label className="text-xs text-text-muted" htmlFor="map-pin">
          标记
        </label>
        <input
          id="map-pin"
          value={label}
          onChange={(event) => setLabel(event.target.value.slice(0, 2))}
          className="w-16 rounded-control border border-border bg-app-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent"
        />
        <button
          type="button"
          className="ml-auto text-xs font-medium text-text-muted"
          onClick={() => setPins({})}
        >
          清空
        </button>
      </div>
      <div
        className="grid min-h-0 flex-1 grid-cols-8 gap-1"
        style={{ gridTemplateRows: `repeat(${MAP_ROWS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: MAP_COLS * MAP_ROWS }, (_, index) => {
          const key = String(index);
          const mark = pins[key];
          return (
            <button
              key={key}
              type="button"
              aria-label={mark ? `格子 ${index + 1}，${mark}` : `格子 ${index + 1}`}
              onClick={() =>
                setPins((current) => {
                  const next = { ...current };
                  if (next[key]) delete next[key];
                  else if (label.trim()) next[key] = label.trim();
                  return next;
                })
              }
              className={cn(
                'rounded-thumb border border-border-subtle text-xs font-semibold',
                mark ? 'bg-accent text-accent-text' : 'bg-app-bg text-text-muted',
              )}
            >
              {mark}
            </button>
          );
        })}
      </div>
    </div>
  );
}
