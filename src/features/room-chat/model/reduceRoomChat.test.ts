import { describe, expect, it } from 'vitest';
import { initialRoomChatState, reduceRoomChat } from './reduceRoomChat';
import type { PendingMessage, RoomMessage } from './types';

function message(id: string, text = id): RoomMessage {
  return {
    messageId: id,
    type: 'chat',
    sender: { maskId: 'mask-1', userId: 'user-1' },
    sendTime: '2026-10-13T08:00:00Z',
    content: [{ type: 'paragraph', children: [{ type: 'text', text }] }],
    veil: { visibility: 'all', revealOnSpaceClose: false },
  };
}

function pending(requestId: string): PendingMessage {
  return {
    requestId,
    status: 'pending',
    draft: { text: '你好', maskId: 'mask-1', veilVisibility: 'all' },
  };
}

describe('reduceRoomChat', () => {
  it('keeps one copy when created arrives twice', () => {
    const once = reduceRoomChat(initialRoomChatState(), {
      type: 'created',
      message: message('m1'),
    });
    const twice = reduceRoomChat(once, { type: 'created', message: message('m1', 'again') });
    expect(twice.messages).toHaveLength(1);
    expect(twice.messages[0]?.content?.[0]?.children?.[0]?.text).toBe('again');
  });

  it('replaces a pending tile when created carries the same request id', () => {
    const submitted = reduceRoomChat(initialRoomChatState(), {
      type: 'submit',
      pending: pending('req-1'),
    });
    const created = reduceRoomChat(submitted, {
      type: 'created',
      requestId: 'req-1',
      message: message('m1'),
    });
    expect(created.pendings).toHaveLength(0);
    expect(created.messages.map((item) => item.messageId)).toEqual(['m1']);
  });

  it('applies an update in place', () => {
    const created = reduceRoomChat(initialRoomChatState(), {
      type: 'created',
      message: message('m1', 'old'),
    });
    const updated = reduceRoomChat(created, {
      type: 'updated',
      message: { ...message('m1', 'new'), pinned: true },
    });
    expect(updated.messages[0]?.content?.[0]?.children?.[0]?.text).toBe('new');
    expect(updated.pinned.map((item) => item.messageId)).toEqual(['m1']);
  });

  it('does not restore a deleted message from a later history page', () => {
    const created = reduceRoomChat(initialRoomChatState(), {
      type: 'created',
      message: message('m2'),
    });
    const deleted = reduceRoomChat(created, { type: 'deleted', messageId: 'm2' });
    const history = reduceRoomChat(deleted, {
      type: 'history',
      mode: 'prepend',
      messages: [message('m2', 'restored body'), message('m1')],
      hasMore: false,
    });
    const restored = history.messages.find((item) => item.messageId === 'm2');
    expect(restored?.deleted).toBe(true);
    expect(restored?.content?.[0]?.children?.[0]?.text).not.toBe('restored body');
    expect(history.messages.map((item) => item.messageId)).toEqual(['m1', 'm2']);
  });

  it('marks a rejection on the pending tile', () => {
    const submitted = reduceRoomChat(initialRoomChatState(), {
      type: 'submit',
      pending: pending('req-1'),
    });
    const rejected = reduceRoomChat(submitted, {
      type: 'rejected',
      requestId: 'req-1',
      error: '面具不可用',
    });
    expect(rejected.pendings).toEqual([
      expect.objectContaining({ requestId: 'req-1', status: 'rejected', error: '面具不可用' }),
    ]);
    expect(rejected.messages).toHaveLength(0);
  });

  it('marks an unconfirmed send and does not queue a resend', () => {
    const submitted = reduceRoomChat(initialRoomChatState(), {
      type: 'submit',
      pending: pending('req-1'),
    });
    const dropped = reduceRoomChat(submitted, { type: 'disconnect' });
    expect(dropped.pendings).toEqual([
      expect.objectContaining({ requestId: 'req-1', status: 'unconfirmed' }),
    ]);
    const again = reduceRoomChat(dropped, { type: 'disconnect' });
    expect(again.pendings).toEqual(dropped.pendings);
    expect(again.messages).toHaveLength(0);
  });
});
