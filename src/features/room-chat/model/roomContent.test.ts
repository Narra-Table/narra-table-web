import { describe, expect, it } from 'vitest';
import { messagePlainText } from './copyText';
import { newestEditRecords, readPreviousRaw } from './editHistory';
import { forwardChildView, orderForwardChildren } from './forwardChildren';
import { moreActions } from './moreActions';
import type { StyledInline } from './richText';
import type { RoomMessage } from './types';

describe('messagePlainText', () => {
  it('uses the display name, writes a face as [表情], and skips ruby', () => {
    const message: RoomMessage = {
      type: 'chat',
      content: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: '看', ruby: 'Cthulhu' } as StyledInline,
            { type: 'mention', displayText: '旁白' },
            { type: 'face', faceId: 'smile' },
          ],
        },
      ],
    };
    expect(messagePlainText(message)).toBe('看旁白[表情]');
  });
});

describe('orderForwardChildren', () => {
  it('sorts copies by seq and keeps an unsequenced snapshot in array order', () => {
    expect(
      orderForwardChildren([
        { seq: 2, senderName: '后' },
        { seq: 1, senderName: '先' },
      ]).map((child) => child.seq),
    ).toEqual([1, 2]);
    expect(
      orderForwardChildren([{ senderName: '甲' }, { senderName: '乙' }]).map(
        (child) => child.senderName,
      ),
    ).toEqual(['甲', '乙']);
  });

  it('shows a missing clue as sender-only and a stripped nested forward as omitted', () => {
    expect(forwardChildView({ type: 'clue', senderName: '甲' })).toBe('sender-only');
    expect(forwardChildView({ type: 'forward', senderName: '甲' })).toBe('omitted');
    expect(
      forwardChildView({
        type: 'clue',
        senderName: '甲',
        clue: { title: '血迹', description: '窗台' },
      }),
    ).toBe('body');
  });
});

describe('moreActions', () => {
  it('hides the panel from observers and veil from players', () => {
    expect(moreActions({ role: 'ob', userId: 'u', senderId: 'u', messageType: 'chat' }).panel).toBe(
      false,
    );
    const own = moreActions({ role: 'pl', userId: 'u', senderId: 'u', messageType: 'chat' });
    expect(own).toMatchObject({ copy: true, edit: true, veil: false, remove: true });
    const other = moreActions({ role: 'pl', userId: 'u', senderId: 'other', messageType: 'chat' });
    expect(other).toMatchObject({ copy: true, edit: false, history: false, pin: false });
    const gm = moreActions({ role: 'gm', userId: 'gm', senderId: 'other', messageType: 'clue' });
    expect(gm).toMatchObject({ veil: true, edit: false, history: true, remove: true });
  });
});

describe('edit history', () => {
  it('lists records from newest to oldest and reads a clue snapshot', () => {
    expect(
      newestEditRecords([
        { editTime: '2026-10-01T00:00:00Z' },
        { editTime: '2026-10-02T00:00:00Z' },
      ]).map((record) => record.editTime),
    ).toEqual(['2026-10-02T00:00:00Z', '2026-10-01T00:00:00Z']);
    expect(
      readPreviousRaw({ title: '血迹', description: '窗台', isDiscovered: false }),
    ).toMatchObject({
      kind: 'clue',
    });
  });
});
