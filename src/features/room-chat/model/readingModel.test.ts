import { describe, expect, it } from 'vitest';
import { groupMessages } from './groupMessages';
import { collectScenes, findScene } from './sceneIndex';
import { compensatePrepend, isStuckToBottom, shouldStickToBottom } from './scrollAnchor';
import type { RoomMessage, StreamEntry } from './types';

function chat(id: string, maskId: string, extra: Partial<RoomMessage> = {}): RoomMessage {
  return {
    messageId: id,
    type: 'chat',
    sender: { maskId, userId: 'user-1' },
    sendTime: '2026-10-13T08:00:00Z',
    deleted: false,
    folded: false,
    veil: { visibility: 'all', revealOnSpaceClose: false, visibleTo: ['user-1'] },
    content: [{ type: 'paragraph', children: [{ type: 'text', text: id }] }],
    ...extra,
  };
}

function entry(message: RoomMessage): StreamEntry {
  return { kind: 'message', message };
}

describe('groupMessages', () => {
  it('merges adjacent chat from the same mask and veil', () => {
    const groups = groupMessages([
      entry(chat('a', 'mask-1')),
      entry(chat('b', 'mask-1', { sendTime: '2026-10-13T12:00:00Z' })),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ kind: 'speech' });
    if (groups[0]?.kind === 'speech')
      expect(groups[0].messages.map((message) => message.messageId)).toEqual(['a', 'b']);
  });

  it('keeps a long pause in the same run', () => {
    const groups = groupMessages([
      entry(chat('a', 'mask-1', { sendTime: '2026-10-13T08:00:00Z' })),
      entry(chat('b', 'mask-1', { sendTime: '2026-10-14T23:00:00Z' })),
    ]);
    expect(groups).toHaveLength(1);
  });

  it('splits when veil visibility differs', () => {
    const groups = groupMessages([
      entry(chat('a', 'mask-1')),
      entry(chat('b', 'mask-1', { veil: { visibility: 'gm_only', revealOnSpaceClose: false } })),
    ]);
    expect(groups).toHaveLength(2);
  });

  it('embeds the next reply inside the command and leaves a separated reply in place', () => {
    const command: RoomMessage = {
      messageId: 'cmd',
      type: 'command',
      raw: '.r 1d20',
      sender: { maskId: 'mask-1' },
      veil: { visibility: 'all' },
    };
    const reply = chat('reply', 'mask-2', { refMessageId: 'cmd', type: 'chat' });
    const between = chat('talk', 'mask-3');
    const attached = groupMessages([entry(command), entry(reply)]);
    expect(attached[0]).toMatchObject({
      kind: 'command',
      embedded: expect.objectContaining({ messageId: 'reply' }),
    });
    expect(attached).toHaveLength(1);

    const separated = groupMessages([entry(command), entry(between), entry(reply)]);
    expect(separated).toHaveLength(3);
    expect(separated[0]).toMatchObject({ kind: 'command', jumpToId: 'reply' });
  });

  it('does not merge a referenced reply into the speech run', () => {
    const groups = groupMessages([
      entry(chat('a', 'mask-1')),
      entry(chat('b', 'mask-1', { refMessageId: 'cmd-1' })),
    ]);
    expect(groups).toHaveLength(2);
  });
});

describe('sceneIndex', () => {
  it('uses message id plus block index and names a blank divider', () => {
    const anchors = collectScenes([
      chat('m1', 'mask-1', {
        content: [
          { type: 'paragraph', children: [{ type: 'text', text: '开场' }] },
          { type: 'divider', label: '  ' },
          { type: 'divider', label: '酒馆' },
        ],
      }),
    ]);
    expect(anchors.map((anchor) => anchor.id)).toEqual(['m1:1', 'm1:2']);
    expect(anchors[0]?.label).toBe('未命名分隔');
    expect(anchors[1]?.label).toBe('酒馆');
  });

  it('returns undefined when the scene is missing', () => {
    const anchors = collectScenes([
      chat('m1', 'mask-1', { content: [{ type: 'divider', label: '酒馆' }] }),
    ]);
    expect(findScene(anchors, 'missing')).toBeUndefined();
    expect(findScene(anchors, 'm1:0')?.label).toBe('酒馆');
  });
});

describe('scrollAnchor', () => {
  it('treats a distance under 32px as stuck', () => {
    expect(isStuckToBottom(69, 200, 100)).toBe(true);
    expect(isStuckToBottom(68, 200, 100)).toBe(false);
  });

  it('keeps the viewport anchor when older history is prepended', () => {
    const previousHeight = 1000;
    const scrollTop = 240;
    const nextHeight = 1360;
    const nextTop = compensatePrepend(previousHeight, nextHeight, scrollTop);
    expect(nextHeight - nextTop).toBe(previousHeight - scrollTop);
  });

  it('does not stick while a jump is in progress', () => {
    expect(shouldStickToBottom({ stuck: true, jumping: true, ownSend: true })).toBe(false);
    expect(shouldStickToBottom({ stuck: false, jumping: false, ownSend: true })).toBe(true);
  });
});
