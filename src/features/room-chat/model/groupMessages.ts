import type { PendingMessage, ReadingGroup, RoomMessage, StreamEntry } from './types';

function audienceKey(ids: string[] | undefined): string {
  return [...(ids ?? [])].sort().join('\0');
}

function veilKey(message: RoomMessage): string {
  const visibility = message.veil?.visibility ?? 'all';
  const reveal = message.veil?.revealOnSpaceClose ? '1' : '0';
  return `${visibility}\0${reveal}\0${audienceKey(message.veil?.visibleTo)}`;
}

export function canMergeSpeech(left: RoomMessage, right: RoomMessage): boolean {
  if (left.type !== 'chat' || right.type !== 'chat') return false;
  if (left.deleted || right.deleted || left.folded || right.folded) return false;
  if (left.refMessageId || right.refMessageId) return false;
  if ((left.sender?.maskId ?? '') !== (right.sender?.maskId ?? '')) return false;
  return veilKey(left) === veilKey(right);
}

function laterReplyId(entries: StreamEntry[], from: number, commandId: string): string | undefined {
  for (let index = from; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry?.kind !== 'message') continue;
    if (entry.message.deleted) continue;
    if (entry.message.refMessageId === commandId && entry.message.messageId) {
      return entry.message.messageId;
    }
  }
  return undefined;
}

export function groupMessages(entries: StreamEntry[]): ReadingGroup[] {
  const groups: ReadingGroup[] = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry) continue;
    if (entry.kind === 'pending') {
      groups.push({ kind: 'pending', pending: entry.pending });
      continue;
    }
    const message = entry.message;
    if (message.deleted) {
      groups.push({ kind: 'deleted', message });
      continue;
    }
    if (message.folded) {
      groups.push({ kind: 'folded', message });
      continue;
    }
    if (message.type === 'command') {
      const commandId = message.messageId ?? '';
      const next = entries[index + 1];
      if (
        next?.kind === 'message' &&
        !next.message.deleted &&
        !next.message.folded &&
        next.message.refMessageId === commandId &&
        commandId
      ) {
        groups.push({ kind: 'command', message, embedded: next.message });
        index += 1;
        continue;
      }
      groups.push({
        kind: 'command',
        message,
        jumpToId: laterReplyId(entries, index + 1, commandId),
      });
      continue;
    }
    if (message.type === 'system') {
      groups.push({ kind: 'system', message });
      continue;
    }
    if (message.type === 'clue') {
      groups.push({ kind: 'clue', message });
      continue;
    }
    if (message.type === 'forward') {
      groups.push({ kind: 'forward', message });
      continue;
    }
    const messages = [message];
    while (index + 1 < entries.length) {
      const peek = entries[index + 1];
      const current = messages[messages.length - 1];
      if (peek?.kind !== 'message' || !current || !canMergeSpeech(current, peek.message)) break;
      messages.push(peek.message);
      index += 1;
    }
    groups.push({ kind: 'speech', messages });
  }
  return groups;
}

export function streamEntries(messages: RoomMessage[], pendings: PendingMessage[]): StreamEntry[] {
  return [
    ...messages.map((message) => ({ kind: 'message' as const, message })),
    ...pendings.map((pending) => ({ kind: 'pending' as const, pending })),
  ];
}
