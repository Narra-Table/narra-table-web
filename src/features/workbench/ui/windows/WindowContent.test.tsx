/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getApiMe, getApiSpacesSpaceId, getApiSpacesSpaceIdMasks } from '@/api';
import type { GithubComNarraTableBackendPkgProtocolMessage as RoomMessage } from '@/api/model';
import { orvalFetch } from '@/lib/apiClient';
import { WindowContent } from './WindowContent';

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getApiMe: vi.fn(),
    getApiSpacesSpaceId: vi.fn(),
    getApiSpacesSpaceIdMasks: vi.fn(),
  };
});
vi.mock('@/lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, orvalFetch: vi.fn() };
});

function message(roomId: string, text: string): RoomMessage {
  return {
    messageId: `${roomId}-${text}`,
    roomId,
    type: 'chat',
    sender: { userId: 'user-1', maskId: 'mask-1' },
    sendTime: '2026-10-28T00:00:00Z',
    content: [{ type: 'paragraph', children: [{ type: 'text', text }] }],
  };
}

const props = {
  spaceId: 'space-1',
  rooms: [
    { roomId: 'room-a', name: '房间 A' },
    { roomId: 'room-b', name: '房间 B' },
  ],
  query: '',
  onRoomChange: vi.fn(),
  onQueryChange: vi.fn(),
  onSceneChange: vi.fn(),
};

function ChatWindow({ roomId, query = '' }: { roomId: string; query?: string }) {
  return (
    <WindowContent
      kind="chat"
      spaceId={props.spaceId}
      roomId={roomId}
      rooms={props.rooms}
      query={query}
      onRoomChange={props.onRoomChange}
      onQueryChange={props.onQueryChange}
      onSceneChange={props.onSceneChange}
      onSeek={vi.fn()}
    />
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
  vi.stubGlobal(
    'WebSocket',
    class {
      addEventListener() {}
      close() {}
    },
  );
  vi.mocked(getApiMe).mockResolvedValue({
    status: 200,
    data: { id: 'user-1' },
    headers: new Headers(),
  });
  vi.mocked(getApiSpacesSpaceId).mockResolvedValue({
    status: 200,
    data: { members: [{ userId: 'user-1', role: 'gm', maskId: 'mask-1' }] },
    headers: new Headers(),
  });
  vi.mocked(getApiSpacesSpaceIdMasks).mockResolvedValue({
    status: 200,
    data: {
      masks: [
        {
          maskId: 'mask-1',
          name: '主持人',
          type: 'gm',
          userIds: ['user-1'],
          createdAt: '2026-10-28T00:00:00Z',
          spaceId: 'space-1',
          updatedAt: '2026-10-28T00:00:00Z',
        },
      ],
    },
    headers: new Headers(),
  });
  vi.mocked(orvalFetch).mockImplementation(async (url) => {
    const roomId = new URL(url, 'http://localhost').pathname.split('/')[5];
    return {
      data: url.includes('pinnedOnly=true')
        ? { messages: [] }
        : { messages: [message(roomId, `${roomId} 的最新发言`)], hasMore: true },
    };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('chat window room isolation', () => {
  it('keeps the draft during a search update and clears it when switching rooms', async () => {
    const view = render(<ChatWindow roomId="room-a" />);
    await screen.findByText('room-a 的最新发言');
    const field = screen.getByLabelText('发言');
    field.innerHTML = '<p>草稿</p>';
    fireEvent.input(field);
    expect(field.textContent).toBe('草稿');

    view.rerender(<ChatWindow roomId="room-a" query="搜索" />);
    expect(screen.getByLabelText('发言').textContent).toBe('草稿');

    view.rerender(<ChatWindow roomId="room-b" />);
    await screen.findByText('room-b 的最新发言');
    expect(screen.getByLabelText('发言').textContent).toBe('');
  });

  it('ignores an older history request finishing after switching rooms', async () => {
    let finishHistory!: (value: { messages: RoomMessage[]; hasMore: boolean }) => void;
    const olderHistory = new Promise<{ messages: RoomMessage[]; hasMore: boolean }>((resolve) => {
      finishHistory = resolve;
    });
    vi.mocked(orvalFetch).mockImplementation(async (url) => {
      const roomId = new URL(url, 'http://localhost').pathname.split('/')[5];
      if (url.includes('pinnedOnly=true')) return { data: { messages: [] } };
      if (url.includes('cursor=')) return { data: await olderHistory };
      return { data: { messages: [message(roomId, `${roomId} 的最新发言`)], hasMore: true } };
    });
    const view = render(<ChatWindow roomId="room-a" />);
    const latest = await screen.findByText('room-a 的最新发言');
    const scroller = latest.closest('.overflow-y-auto');
    expect(scroller).not.toBeNull();
    fireEvent.scroll(scroller!);
    await waitFor(() =>
      expect(
        vi
          .mocked(orvalFetch)
          .mock.calls.some(
            ([url]) =>
              url.includes('/spaces/space-1/rooms/room-a/messages') && url.includes('cursor='),
          ),
      ).toBe(true),
    );

    view.rerender(<ChatWindow roomId="room-b" />);
    await screen.findByText('room-b 的最新发言');
    await act(async () => {
      finishHistory({ messages: [message('room-a', '房间 A 的延迟历史')], hasMore: false });
    });

    expect(screen.queryByText('房间 A 的延迟历史')).toBeNull();
    expect(screen.getByText('room-b 的最新发言')).toBeTruthy();
  });
});
