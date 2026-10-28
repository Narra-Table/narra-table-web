import { describe, expect, it } from 'vitest';
import type { WindowInstance } from '@/features/workbench/core';
import { mergeChatState, readChatState } from './chat-state';

function windowFixture(state?: unknown): WindowInstance {
  return {
    instanceId: 'win-1',
    appId: 'narratable',
    windowTypeId: 'chat',
    title: '聊天',
    chrome: 'full',
    ...(state === undefined ? {} : { state }),
  };
}

describe('chat window state', () => {
  it('reads room, scene and query from opaque state', () => {
    expect(readChatState(windowFixture({ roomId: 'r1', scene: 's1', query: '线索' }))).toEqual({
      roomId: 'r1',
      scene: 's1',
      query: '线索',
    });
  });

  it('ignores malformed state', () => {
    expect(readChatState(windowFixture('nope'))).toEqual({});
    expect(readChatState(windowFixture({ roomId: 42, scene: null }))).toEqual({});
    expect(readChatState(undefined)).toEqual({});
  });

  it('merges patches without dropping unknown app state', () => {
    expect(
      mergeChatState(windowFixture({ roomId: 'r1', extra: { keep: true } }), {
        roomId: 'r2',
        query: '地图',
      }),
    ).toEqual({ roomId: 'r2', extra: { keep: true }, query: '地图' });
  });
});
