import { useId, useState, type FormEvent, type ReactNode } from 'react';
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

const MASK_TYPE_LABELS: Record<string, string> = {
  character: '玩家角色',
  npc: '非玩家角色',
  gm: '主持人角色',
  system: '系统角色',
};

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
    <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
      {visibleMasks.map((mask) => (
        <li key={mask.maskId} className="flex items-center gap-3 bg-app-bg px-3 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-semibold text-text">
            {mask.name.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-medium text-text">{mask.name}</span>
            <span className="mt-1 block text-xs text-text-muted">
              {MASK_TYPE_LABELS[mask.type] ?? mask.type}
            </span>
          </span>
          <span className="shrink-0 text-right text-xs text-text-muted">
            {mask.isDefault ? <span className="block text-accent">默认</span> : null}
            <span className="block">{mask.characterCards?.length ?? 0} 张角色卡</span>
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
    <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
      {visibleClues.map((message, index) => (
        <li
          key={message.messageId ?? String(index)}
          className="border border-border-subtle bg-app-bg px-4 py-3"
        >
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
          {message.clue?.tags?.length ? (
            <p className="mt-2 truncate text-xs text-accent">{message.clue.tags.join(' / ')}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function CombatWindow({ spaceId, query = '' }: SpaceWindowProps & { query?: string }) {
  const [name, setName] = useState('');
  const [initiative, setInitiative] = useState('10');
  const [combatants, setCombatants] = useState<
    Array<{ id: number; name: string; initiative: number }>
  >([]);
  const [nextId, setNextId] = useState(1);
  const suggestionsId = useId();
  const { data: masks } = useGetApiSpacesSpaceIdMasks(spaceId, {
    query: { select: (response) => (response.status === 200 ? response.data.masks : []) },
  });

  const orderedCombatants = combatants
    .filter((combatant) => matchesQuery(query, combatant.name, String(combatant.initiative)))
    .sort(
      (left, right) =>
        right.initiative - left.initiative || left.name.localeCompare(right.name, 'zh'),
    );

  function addCombatant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const parsedInitiative = Number(initiative);
    if (!trimmedName || !Number.isFinite(parsedInitiative)) return;
    setCombatants((current) => [
      ...current,
      { id: nextId, name: trimmedName, initiative: parsedInitiative },
    ]);
    setNextId((current) => current + 1);
    setName('');
  }

  return (
    <form className="flex min-h-0 flex-1 flex-col gap-3 p-3" onSubmit={addCombatant}>
      <div className="flex gap-2">
        <input
          aria-label="战斗单位"
          className="min-w-0 flex-1 border border-border bg-app-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          list={suggestionsId}
          placeholder="角色名"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <datalist id={suggestionsId}>
          {masks?.map((mask) => (
            <option key={mask.maskId} value={mask.name} />
          ))}
        </datalist>
        <input
          aria-label="先攻"
          className="w-18 border border-border bg-app-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          inputMode="numeric"
          value={initiative}
          onChange={(event) => setInitiative(event.target.value)}
        />
        <button
          type="submit"
          className="shrink-0 bg-accent px-4 py-2 text-sm font-semibold text-accent-text"
        >
          加入
        </button>
      </div>
      <ol className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {!combatants.length ? (
          <li className="grid min-h-20 place-items-center text-sm text-text-muted">
            先攻列表是空的
          </li>
        ) : null}
        {combatants.length > 0 && !orderedCombatants.length ? (
          <li className="grid min-h-20 place-items-center text-sm text-text-muted">
            没有匹配的参战角色
          </li>
        ) : null}
        {orderedCombatants.map((combatant, index) => (
          <li
            key={combatant.id}
            className="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-2 bg-app-bg px-3 py-3"
          >
            <span className="text-lg font-semibold text-warning">{index + 1}</span>
            <span className="min-w-0 truncate text-base text-text">{combatant.name}</span>
            <span className="text-base font-semibold text-accent">{combatant.initiative}</span>
            <button
              type="button"
              className="px-2 py-1 text-xs text-text-muted hover:text-danger"
              aria-label={`移除${combatant.name}`}
              onClick={() =>
                setCombatants((current) =>
                  current.filter((candidate) => candidate.id !== combatant.id),
                )
              }
            >
              移除
            </button>
          </li>
        ))}
      </ol>
    </form>
  );
}

export function MapWindow({ spaceId, roomId }: SpaceWindowProps & { roomId?: string }) {
  const [pins, setPins] = useState<Record<number, string>>({});
  const [label, setLabel] = useState('甲');
  const labelId = useId();
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
      <div className="flex items-center gap-2">
        <label className="text-xs text-text-muted" htmlFor={labelId}>
          标记
        </label>
        <input
          id={labelId}
          aria-label="地图标记"
          className="w-16 border border-border bg-app-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent"
          value={label}
          onChange={(event) => setLabel(event.target.value.slice(0, 2))}
        />
        <button
          type="button"
          className="ml-auto px-2 py-1 text-xs text-text-muted hover:text-text"
          onClick={() => setPins({})}
        >
          清空
        </button>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-1">
        {Array.from({ length: 16 }, (_, index) => {
          const mark = pins[index];
          const scene = scenes?.[index]?.label;
          const displayLabel = mark ?? scene;
          return (
            <button
              key={index}
              type="button"
              aria-label={displayLabel ? `格子 ${index + 1}，${displayLabel}` : `格子 ${index + 1}`}
              className={cn(
                'min-h-12 border border-border-subtle text-sm font-semibold',
                mark
                  ? 'bg-accent text-accent-text'
                  : scene
                    ? 'bg-info/15 text-info'
                    : 'bg-app-bg text-text-muted',
              )}
              onClick={() =>
                setPins((current) => {
                  const next = { ...current };
                  if (next[index]) delete next[index];
                  else if (label.trim()) next[index] = label.trim();
                  return next;
                })
              }
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
