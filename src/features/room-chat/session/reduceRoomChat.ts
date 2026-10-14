import type { PendingMessage, RoomMessage } from '../model/types';
import { chronological } from './history';

export interface RoomChatState {
  messages: RoomMessage[];
  pendings: PendingMessage[];
  pinned: RoomMessage[];
  tombstones: string[];
  hasMore: boolean;
}

export type RoomChatAction =
  | { type: 'reset' }
  | {
      type: 'history';
      mode: 'replace' | 'prepend' | 'merge';
      messages: RoomMessage[];
      hasMore?: boolean;
    }
  | { type: 'pins'; messages: RoomMessage[] }
  | { type: 'created'; message: RoomMessage; requestId?: string }
  | { type: 'updated'; message: RoomMessage }
  | { type: 'deleted'; messageId: string }
  | { type: 'veil'; messageIds: string[] }
  | { type: 'submit'; pending: PendingMessage }
  | { type: 'rejected'; requestId: string; error: string }
  | { type: 'disconnect' }
  | { type: 'retry'; requestId: string; nextRequestId: string };

export function initialRoomChatState(): RoomChatState {
  return { messages: [], pendings: [], pinned: [], tombstones: [], hasMore: false };
}

function tombstoneSet(ids: readonly string[]): Set<string> {
  return new Set(ids);
}

function rememberTombstone(ids: string[], messageId: string | undefined): string[] {
  if (!messageId || ids.includes(messageId)) return ids;
  return [...ids, messageId];
}

function isTombstoned(message: RoomMessage, tombs: ReadonlySet<string>): boolean {
  return Boolean(message.deleted || (message.messageId && tombs.has(message.messageId)));
}

function tombstoneMessage(message: RoomMessage): RoomMessage {
  return {
    messageId: message.messageId,
    roomId: message.roomId,
    spaceId: message.spaceId,
    type: message.type,
    sender: message.sender,
    sendTime: message.sendTime,
    deleted: true,
    pinned: false,
    folded: false,
    veil: message.veil,
  };
}

function mergeChrono(
  existing: RoomMessage[],
  incoming: RoomMessage[],
  placement: 'older' | 'newer',
  tombs: ReadonlySet<string>,
): RoomMessage[] {
  const result = existing.map((message) =>
    isTombstoned(message, tombs) ? { ...message, deleted: true } : message,
  );
  const index = new Map<string, number>();
  const reindex = () => {
    index.clear();
    result.forEach((message, at) => {
      if (message.messageId) index.set(message.messageId, at);
    });
  };
  reindex();

  for (let cursor = 0; cursor < incoming.length; cursor += 1) {
    const raw = incoming[cursor];
    if (!raw?.messageId) continue;
    const message = isTombstoned(raw, tombs) ? tombstoneMessage(raw) : raw;
    const current = index.get(raw.messageId);
    if (current !== undefined) {
      result[current] = isTombstoned(raw, tombs) ? { ...result[current], deleted: true } : message;
      continue;
    }
    let insertAt = placement === 'older' ? 0 : result.length;
    let anchored = false;
    for (let previous = cursor - 1; previous >= 0; previous -= 1) {
      const previousId = incoming[previous]?.messageId;
      if (previousId && index.has(previousId)) {
        insertAt = (index.get(previousId) ?? 0) + 1;
        anchored = true;
        break;
      }
    }
    if (!anchored) {
      for (let next = cursor + 1; next < incoming.length; next += 1) {
        const nextId = incoming[next]?.messageId;
        if (nextId && index.has(nextId)) {
          insertAt = index.get(nextId) ?? insertAt;
          break;
        }
      }
    }
    result.splice(insertAt, 0, message);
    reindex();
  }
  return result;
}

function applyHistory(
  state: RoomChatState,
  action: Extract<RoomChatAction, { type: 'history' }>,
): RoomChatState {
  let tombstones = state.tombstones;
  for (const message of action.messages) {
    if (message.deleted) tombstones = rememberTombstone(tombstones, message.messageId);
  }
  const tombs = tombstoneSet(tombstones);
  const incoming = chronological(action.messages).map((message) =>
    isTombstoned(message, tombs) ? tombstoneMessage(message) : message,
  );
  const messages =
    action.mode === 'replace'
      ? incoming
      : mergeChrono(state.messages, incoming, action.mode === 'prepend' ? 'older' : 'newer', tombs);
  return {
    ...state,
    messages,
    tombstones,
    hasMore: action.hasMore ?? state.hasMore,
  };
}

function replacePending(
  pendings: PendingMessage[],
  requestId: string | undefined,
): PendingMessage[] {
  if (!requestId) return pendings;
  return pendings.filter((pending) => pending.requestId !== requestId);
}

function syncPinned(
  pinned: RoomMessage[],
  message: RoomMessage,
  tombs: ReadonlySet<string>,
): RoomMessage[] {
  if (!message.messageId || isTombstoned(message, tombs)) {
    return pinned.filter((item) => item.messageId !== message.messageId);
  }
  if (!message.pinned) return pinned.filter((item) => item.messageId !== message.messageId);
  const next = message;
  if (pinned.some((item) => item.messageId === message.messageId)) {
    return pinned.map((item) => (item.messageId === message.messageId ? next : item));
  }
  return [...pinned, next];
}

export function reduceRoomChat(state: RoomChatState, action: RoomChatAction): RoomChatState {
  switch (action.type) {
    case 'reset':
      return initialRoomChatState();
    case 'history':
      return applyHistory(state, action);
    case 'pins':
      return {
        ...state,
        pinned: chronological(action.messages).filter(
          (message) => !isTombstoned(message, tombstoneSet(state.tombstones)),
        ),
      };
    case 'created': {
      const tombstones = action.message.deleted
        ? rememberTombstone(state.tombstones, action.message.messageId)
        : state.tombstones;
      const tombs = tombstoneSet(tombstones);
      const pendings = replacePending(state.pendings, action.requestId);
      const message = isTombstoned(action.message, tombs)
        ? tombstoneMessage(action.message)
        : action.message;
      if (!message.messageId) return { ...state, pendings, tombstones };
      if (state.messages.some((item) => item.messageId === message.messageId)) {
        return {
          ...state,
          tombstones,
          pendings,
          messages: state.messages.map((item) =>
            item.messageId === message.messageId
              ? isTombstoned(action.message, tombs)
                ? { ...item, deleted: true }
                : message
              : item,
          ),
          pinned: syncPinned(state.pinned, message, tombs),
        };
      }
      return {
        ...state,
        tombstones,
        pendings,
        messages: [...state.messages, message],
        pinned: syncPinned(state.pinned, message, tombs),
      };
    }
    case 'updated': {
      const tombstones = action.message.deleted
        ? rememberTombstone(state.tombstones, action.message.messageId)
        : state.tombstones;
      const tombs = tombstoneSet(tombstones);
      const blocked = isTombstoned(action.message, tombs);
      const message = blocked ? tombstoneMessage(action.message) : action.message;
      if (
        !message.messageId ||
        !state.messages.some((item) => item.messageId === message.messageId)
      ) {
        return { ...state, tombstones, pinned: syncPinned(state.pinned, message, tombs) };
      }
      return {
        ...state,
        tombstones,
        messages: state.messages.map((item) => {
          if (item.messageId !== message.messageId) return item;
          return blocked ? { ...item, deleted: true } : message;
        }),
        pinned: syncPinned(state.pinned, message, tombs),
      };
    }
    case 'deleted': {
      const tombstones = rememberTombstone(state.tombstones, action.messageId);
      return {
        ...state,
        tombstones,
        messages: state.messages.map((message) =>
          message.messageId === action.messageId ? { ...message, deleted: true } : message,
        ),
        pinned: state.pinned.filter((message) => message.messageId !== action.messageId),
      };
    }
    case 'veil': {
      const ids = new Set(action.messageIds);
      const reveal = (message: RoomMessage): RoomMessage => {
        if (!message.messageId || !ids.has(message.messageId)) return message;
        return { ...message, veil: { ...message.veil, visibility: 'all', visibleTo: [] } };
      };
      return { ...state, messages: state.messages.map(reveal), pinned: state.pinned.map(reveal) };
    }
    case 'submit':
      return { ...state, pendings: [...state.pendings, action.pending] };
    case 'rejected':
      return {
        ...state,
        pendings: state.pendings.map((pending) =>
          pending.requestId === action.requestId
            ? { ...pending, status: 'rejected', error: action.error }
            : pending,
        ),
      };
    case 'disconnect':
      return {
        ...state,
        pendings: state.pendings.map((pending) =>
          pending.status === 'pending' ? { ...pending, status: 'unconfirmed' } : pending,
        ),
      };
    case 'retry':
      return {
        ...state,
        pendings: state.pendings.map((pending) =>
          pending.requestId === action.requestId
            ? { ...pending, requestId: action.nextRequestId, status: 'pending', error: undefined }
            : pending,
        ),
      };
    default:
      return state;
  }
}
