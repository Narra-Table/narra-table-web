import { useGetApiSpacesSpaceIdRoomsRoomIdMessages } from '@/api';

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
