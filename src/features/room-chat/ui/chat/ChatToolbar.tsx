import { Search, X } from 'lucide-react';
import type { GithubComNarraTableBackendPkgProtocolRoom } from '@/api/model/githubComNarraTableBackendPkgProtocolRoom';

interface ChatToolbarProps {
  rooms: GithubComNarraTableBackendPkgProtocolRoom[];
  roomId: string;
  query: string;
  onRoomChange: (roomId: string) => void;
  onQueryChange: (value: string) => void;
}

export function ChatToolbar({
  rooms,
  roomId,
  query,
  onRoomChange,
  onQueryChange,
}: ChatToolbarProps) {
  const roomName = rooms.find((item) => item.roomId === roomId)?.name;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-3 py-1.5">
      <label className="flex min-w-0 items-center gap-1.5">
        <span className="shrink-0 text-xs text-text-muted">房间</span>
        {rooms.length > 1 ? (
          <select
            aria-label="切换房间"
            value={roomId}
            onChange={(event) => onRoomChange(event.target.value)}
            className="max-w-40 min-w-0 truncate rounded-control border border-border bg-surface-muted px-2 py-1 text-sm font-medium text-text outline-none focus:border-accent"
          >
            {rooms.map((item) => (
              <option key={item.roomId} value={item.roomId}>
                {item.name || '未命名房间'}
              </option>
            ))}
          </select>
        ) : (
          <span className="truncate text-sm font-medium text-text">{roomName || '房间'}</span>
        )}
      </label>
      <label className="relative min-w-0 flex-1 basis-44">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="搜索已加载的发言"
          aria-label="搜索已加载的发言"
          className="w-full rounded-control border border-border bg-surface-muted py-1 pr-7 pl-7 text-sm text-text outline-none focus:border-accent"
        />
        {query ? (
          <button
            type="button"
            aria-label="清除搜索"
            onClick={() => onQueryChange('')}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-text-muted"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </label>
    </div>
  );
}
