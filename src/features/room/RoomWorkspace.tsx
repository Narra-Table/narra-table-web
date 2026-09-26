import { ArrowLeft, LoaderCircle, Send, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useGetApiSpacesSpaceIdRooms,
  useGetApiSpacesSpaceIdRoomsRoomIdMessages,
  usePostApiSpacesSpaceIdRoomsRoomIdJoin,
  usePostApiSpacesSpaceIdRoomsRoomIdLeave,
} from '@/api';
import type { GithubComNarraTableBackendPkgProtocolMessage } from '@/api/model';
import { RealtimeClient, type RealtimeStatus } from '@/lib/realtime';

function messageText(message: GithubComNarraTableBackendPkgProtocolMessage): string {
  return (message.content ?? [])
    .flatMap((block) => block.children ?? [])
    .map((inline) => inline.text ?? inline.displayText ?? '')
    .join('');
}

export function RoomWorkspace({ spaceId, roomId }: { spaceId: string; roomId: string }) {
  const [messages, setMessages] = useState<GithubComNarraTableBackendPkgProtocolMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<RealtimeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const client = useMemo(() => new RealtimeClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const rooms = useGetApiSpacesSpaceIdRooms(spaceId, {
    query: { select: (response) => response.data.rooms ?? [] },
  });
  const history = useGetApiSpacesSpaceIdRoomsRoomIdMessages(
    spaceId,
    roomId,
    { limit: 50 },
    {
      query: { select: (response) => response.data },
    },
  );
  const { mutateAsync: joinRoom } = usePostApiSpacesSpaceIdRoomsRoomIdJoin();
  const { mutate: leaveRoom } = usePostApiSpacesSpaceIdRoomsRoomIdLeave();
  const { refetch: refetchHistory } = history;
  const room = rooms.data?.find((item) => item.roomId === roomId);

  useEffect(() => {
    setMessages(history.data?.messages ?? []);
  }, [history.data]);

  useEffect(() => {
    const removeStatus = client.onStatus(setStatus);
    const removeEvent = client.onEvent((event) => {
      if (event.type === 'connection.gap') {
        setError('连接期间有消息缺失，正在从历史接口补齐。');
        void refetchHistory();
        return;
      }
      const message = event.message;
      if (!message || message.roomId !== roomId) return;
      setMessages((current) => {
        const index = current.findIndex((item) => item.messageId === message.messageId);
        if (event.type === 'message.updated' && index >= 0) {
          const next = current.slice();
          next[index] = message;
          return next;
        }
        if (index >= 0) return current;
        return [...current, message];
      });
    });
    let active = true;
    void joinRoom({ spaceId, roomId })
      .then(() => client.connect())
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : '无法加入房间');
      });
    return () => {
      active = false;
      client.close();
      leaveRoom({ spaceId, roomId });
      removeStatus();
      removeEvent();
    };
  }, [client, joinRoom, leaveRoom, refetchHistory, roomId, spaceId]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || status !== 'authenticated') return;
    setDraft('');
    setError(null);
    try {
      await client.sendMessage({
        roomId,
        messageType: 'chat',
        content: [{ type: 'paragraph', children: [{ type: 'text', text }] }],
        veil: { visibility: 'all', revealOnSpaceClose: false },
      });
      inputRef.current?.focus();
    } catch (reason: unknown) {
      setDraft(text);
      setError(reason instanceof Error ? reason.message : '发送失败');
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 flex-col bg-app-bg">
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <ArrowLeft className="size-4 shrink-0 text-text-muted" />
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{room?.name ?? '房间'}</h2>
            <p className="text-xs text-text-muted">{room?.memberCount ?? 0} 人在线</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted" title={status}>
          {status === 'authenticated' ? (
            <Wifi className="size-4 text-success" />
          ) : (
            <WifiOff className="size-4" />
          )}
          {status === 'connecting' || status === 'reconnecting' ? (
            <LoaderCircle className="size-3 animate-spin" />
          ) : null}
          <span>
            {status === 'authenticated'
              ? '已连接'
              : status === 'reconnecting'
                ? '重连中'
                : '未连接'}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {history.isLoading ? <p className="text-sm text-text-muted">加载消息中...</p> : null}
        {messages.length === 0 && !history.isLoading ? (
          <p className="text-sm text-text-muted">还没有消息。</p>
        ) : null}
        <div className="grid gap-3">
          {messages.map((message) => (
            <article
              key={message.messageId}
              className="rounded-card border border-border-subtle bg-surface px-4 py-3"
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-text-muted">
                <span>{message.sender?.maskId ?? message.sender?.userId ?? '未知用户'}</span>
                <time>
                  {message.sendTime ? new Date(message.sendTime).toLocaleTimeString() : ''}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm text-text">
                {messageText(message) || '[非文本消息]'}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="border-t border-border-subtle bg-surface px-5 py-3">
        {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}
        <form className="flex gap-2" onSubmit={sendMessage}>
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-w-0 flex-1 rounded-control border border-border bg-app-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
            placeholder={status === 'authenticated' ? '发送消息...' : '正在连接...'}
            disabled={status !== 'authenticated'}
          />
          <button
            type="submit"
            disabled={!draft.trim() || status !== 'authenticated'}
            className="grid size-10 shrink-0 place-items-center rounded-control bg-accent text-accent-text transition-opacity hover:opacity-90 disabled:opacity-40"
            aria-label="发送消息"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
