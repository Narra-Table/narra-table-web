import { useState, type ReactNode } from 'react';
import {
  useGetApiSpacesSpaceId,
  useGetApiSpacesSpaceIdClues,
  useGetApiSpacesSpaceIdMasks,
  useGetApiSpacesSpaceIdRoomsRoomIdMessages,
  useGetApiSpacesSpaceIdRoomsRoomIdScenes,
} from '@/api';
import { cn } from '@/lib/classNames';

interface SpaceWindowProps {
  spaceId: string;
}

function WindowState({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-0 flex-1 place-items-center p-4 text-sm text-text-muted">
      {children}
    </div>
  );
}

function messageText(message: {
  content?: Array<{ children?: Array<{ text?: string; displayText?: string }> }>;
  raw?: string;
  command?: string;
  clue?: { title?: string };
  messageId?: string;
}): string {
  const content = message.content
    ?.flatMap((block) => block.children ?? [])
    .map((inline) => inline.text ?? inline.displayText)
    .filter(Boolean)
    .join(' ');
  return (
    content || message.raw || message.command || message.clue?.title || message.messageId || '消息'
  );
}

function matchesQuery(query: string, ...values: Array<string | undefined>): boolean {
  const needle = query.trim().toLocaleLowerCase();
  return !needle || values.some((value) => value?.toLocaleLowerCase().includes(needle));
}

export function ChatWindow({
  spaceId,
  roomId,
  query = '',
}: SpaceWindowProps & { roomId?: string; query?: string }) {
  const {
    data: messages,
    isPending,
    isError,
  } = useGetApiSpacesSpaceIdRoomsRoomIdMessages(spaceId, roomId ?? '', undefined, {
    query: {
      enabled: Boolean(roomId),
      select: (response) => response.data.messages ?? [],
    },
  });

  if (!roomId) return <WindowState>请选择聊天房间</WindowState>;
  if (isPending) return <WindowState>加载中</WindowState>;
  if (isError) return <WindowState>聊天数据加载失败</WindowState>;
  if (!messages?.length) return <WindowState>暂无消息</WindowState>;
  const visibleMessages = messages.filter((message) =>
    matchesQuery(query, message.sender?.maskId, message.sender?.userId, messageText(message)),
  );
  if (!visibleMessages.length) return <WindowState>没有匹配的聊天记录</WindowState>;

  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      {visibleMessages.map((message, index) => (
        <li key={message.messageId ?? String(index)}>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-accent">
              {message.sender?.maskId ?? message.sender?.userId ?? '匿名'}
            </span>
            {message.sendTime ? <time className="text-text-muted">{message.sendTime}</time> : null}
          </div>
          <p className="mt-1 text-base text-text">{messageText(message)}</p>
        </li>
      ))}
    </ul>
  );
}

export function CharactersWindow({ spaceId, query = '' }: SpaceWindowProps & { query?: string }) {
  const {
    data: masks,
    isPending,
    isError,
  } = useGetApiSpacesSpaceIdMasks(spaceId, {
    query: { select: (response) => (response.status === 200 ? response.data.masks : []) },
  });

  if (isPending) return <WindowState>加载中</WindowState>;
  if (isError) return <WindowState>角色数据加载失败</WindowState>;
  if (!masks?.length) return <WindowState>暂无角色</WindowState>;
  const visibleMasks = masks.filter((mask) => matchesQuery(query, mask.name, mask.type));
  if (!visibleMasks.length) return <WindowState>没有匹配的空间角色</WindowState>;

  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
      {visibleMasks.map((mask) => (
        <li key={mask.maskId} className="grid grid-cols-[1fr_auto] gap-3 bg-app-bg px-3 py-3">
          <span className="min-w-0">
            <span className="block truncate text-base font-medium text-text">{mask.name}</span>
            <span className="mt-1 block text-xs text-text-muted">{mask.type}</span>
          </span>
          <span className="text-right text-xs text-text-muted">
            {mask.characterCards?.length ?? 0} 张角色卡
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MembersWindow({ spaceId, query = '' }: SpaceWindowProps & { query?: string }) {
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const {
    data: members,
    isPending,
    isError,
  } = useGetApiSpacesSpaceId(spaceId, {
    query: { select: (response) => response.data.members ?? [] },
  });

  if (isPending) return <WindowState>加载中</WindowState>;
  if (isError) return <WindowState>成员数据加载失败</WindowState>;
  if (!members?.length) return <WindowState>暂无成员</WindowState>;
  const visibleMembers = members.filter((member) =>
    matchesQuery(query, member.displayName, member.userId, member.role),
  );
  if (!visibleMembers.length) return <WindowState>没有匹配的空间成员</WindowState>;

  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
      {visibleMembers.map((member, index) => {
        const key = member.userId ?? String(index);
        return (
          <li key={key} className="flex items-center gap-2 bg-app-bg px-3 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base text-text">
                {member.displayName ?? member.userId}
              </span>
              <span className="block text-xs text-text-muted">{member.role ?? 'member'}</span>
            </span>
            <button
              type="button"
              className={cn('text-xs', ready[key] ? 'text-success' : 'text-text-muted')}
              onClick={() => setReady((current) => ({ ...current, [key]: !current[key] }))}
            >
              {ready[key] ? '已就绪' : '未就绪'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function CluesWindow({ spaceId, query = '' }: SpaceWindowProps & { query?: string }) {
  const {
    data: clues,
    isPending,
    isError,
  } = useGetApiSpacesSpaceIdClues(spaceId, undefined, {
    query: { select: (response) => (response.status === 200 ? (response.data.clues ?? []) : []) },
  });

  if (isPending) return <WindowState>加载中</WindowState>;
  if (isError) return <WindowState>线索数据加载失败</WindowState>;
  if (!clues?.length) return <WindowState>暂无线索</WindowState>;
  const visibleClues = clues.filter((message) =>
    matchesQuery(query, message.clue?.title, message.clue?.description),
  );
  if (!visibleClues.length) return <WindowState>没有匹配的线索</WindowState>;

  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
      {visibleClues.map((message, index) => (
        <li key={message.messageId ?? String(index)} className="bg-app-bg px-3 py-3">
          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1 truncate text-base font-medium text-text">
              {message.clue?.title ?? message.messageId}
            </span>
            <span className="text-xs text-info">
              {message.clue?.isDiscovered ? '已发现' : '未发现'}
            </span>
          </div>
          {message.clue?.description ? (
            <p className="mt-1 text-sm text-text-muted">{message.clue.description}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function CombatWindow({ spaceId, query = '' }: SpaceWindowProps & { query?: string }) {
  const {
    data: masks,
    isPending,
    isError,
  } = useGetApiSpacesSpaceIdMasks(spaceId, {
    query: { select: (response) => (response.status === 200 ? response.data.masks : []) },
  });

  if (isPending) return <WindowState>加载中</WindowState>;
  if (isError) return <WindowState>战斗数据加载失败</WindowState>;
  if (!masks?.length) return <WindowState>暂无参战角色</WindowState>;
  const visibleCombatants = masks
    .map((mask, index) => ({ mask, index }))
    .filter(({ mask }) => matchesQuery(query, mask.name, mask.type));
  if (!visibleCombatants.length) return <WindowState>没有匹配的参战角色</WindowState>;

  return (
    <ol className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
      {visibleCombatants.map(({ mask, index }) => (
        <li
          key={mask.maskId}
          className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 bg-app-bg px-3 py-3"
        >
          <span className="text-lg font-semibold text-warning">{index + 1}</span>
          <span className="min-w-0">
            <span className="block truncate text-base text-text">{mask.name}</span>
            <span className="block text-xs text-text-muted">{mask.type}</span>
          </span>
          <span className="text-xs text-info">{index === 0 ? '行动中' : '等待'}</span>
        </li>
      ))}
    </ol>
  );
}

export function MapWindow({ spaceId, roomId }: SpaceWindowProps & { roomId?: string }) {
  const [pins, setPins] = useState<Set<number>>(() => new Set([5, 10]));
  const {
    data: scenes,
    isPending,
    isError,
  } = useGetApiSpacesSpaceIdRoomsRoomIdScenes(spaceId, roomId ?? '', {
    query: {
      enabled: Boolean(roomId),
      select: (response) => (response.status === 200 ? (response.data.scenes ?? []) : []),
    },
  });

  if (!roomId) return <WindowState>请选择房间</WindowState>;
  if (isPending) return <WindowState>加载中</WindowState>;
  if (isError) return <WindowState>地图数据加载失败</WindowState>;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <button
        type="button"
        className="self-end text-xs text-text-muted hover:text-text"
        onClick={() => setPins(new Set())}
      >
        清空
      </button>
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-1">
        {Array.from({ length: 16 }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`格子 ${index + 1}`}
            className={cn(
              'min-h-12 rounded-control border border-border-subtle text-sm',
              pins.has(index) || scenes?.[index]
                ? 'bg-accent text-accent-text'
                : 'bg-app-bg text-text-muted',
            )}
            onClick={() =>
              setPins((current) => {
                const next = new Set(current);
                if (next.has(index)) next.delete(index);
                else next.add(index);
                return next;
              })
            }
          >
            {scenes?.[index]?.label ?? (pins.has(index) ? '•' : '')}
          </button>
        ))}
      </div>
    </div>
  );
}
