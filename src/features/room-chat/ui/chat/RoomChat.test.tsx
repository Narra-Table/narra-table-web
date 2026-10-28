/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getApiMe, getApiSpacesSpaceId, getApiSpacesSpaceIdMasks } from '@/api';
import { fetchRoomMessages } from '../../api/history';
import { RoomSocket } from '../../api/roomSocket';
import type { RoomMessage } from '../../model/types';
import { RoomChat } from './RoomChat';

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getApiMe: vi.fn(),
    getApiSpacesSpaceId: vi.fn(),
    getApiSpacesSpaceIdMasks: vi.fn(),
  };
});
vi.mock('../../api/history', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, fetchRoomMessages: vi.fn() };
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
  return <RoomChat key={roomId} {...props} roomId={roomId} query={query} />;
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
  vi.spyOn(RoomSocket.prototype, 'start').mockImplementation(() => {});
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
  vi.mocked(fetchRoomMessages).mockImplementation(async (_spaceId, roomId, query) =>
    query?.pinnedOnly
      ? { messages: [] }
      : { messages: [message(roomId, `${roomId} 的最新发言`)], hasMore: true },
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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
    vi.mocked(fetchRoomMessages).mockImplementation(async (_spaceId, roomId, query) => {
      if (query?.pinnedOnly) return { messages: [] };
      if (query?.cursor) return olderHistory;
      return { messages: [message(roomId, `${roomId} 的最新发言`)], hasMore: true };
    });
    const view = render(<ChatWindow roomId="room-a" />);
    const latest = await screen.findByText('room-a 的最新发言');
    const scroller = latest.closest('.overflow-y-auto');
    expect(scroller).not.toBeNull();
    fireEvent.scroll(scroller!);
    await waitFor(() =>
      expect(
        vi
          .mocked(fetchRoomMessages)
          .mock.calls.some(
            ([space, room, query]) =>
              space === 'space-1' && room === 'room-a' && typeof query?.cursor === 'string',
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
