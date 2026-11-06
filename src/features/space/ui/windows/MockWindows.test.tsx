/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ChatWindow,
  CharactersWindow,
  CluesWindow,
  CombatWindow,
  MapWindow,
  MembersWindow,
} from './MockWindows';

vi.mock('@/api', () => ({
  useGetApiSpacesSpaceId: vi.fn(() => ({
    data: [{ userId: 'user-1', displayName: 'Generated member', role: 'pl' }],
    isPending: false,
    isError: false,
  })),
  useGetApiSpacesSpaceIdClues: vi.fn(() => ({
    data: [
      {
        messageId: 'clue-1',
        clue: { title: 'Generated clue', description: 'Generated detail', isDiscovered: true },
      },
    ],
    isPending: false,
    isError: false,
  })),
  useGetApiSpacesSpaceIdMasks: vi.fn(() => ({
    data: [
      { maskId: 'mask-1', name: 'Generated mask', type: 'character', characterCards: ['card-1'] },
    ],
    isPending: false,
    isError: false,
  })),
  useGetApiSpacesSpaceIdRoomsRoomIdMessages: vi.fn(() => ({
    data: [
      {
        messageId: 'message-1',
        sender: { maskId: 'Generated sender' },
        content: [{ children: [{ text: 'Generated message' }] }],
      },
    ],
    isPending: false,
    isError: false,
  })),
  useGetApiSpacesSpaceIdRoomsRoomIdScenes: vi.fn(() => ({
    data: [{ messageId: 'scene-1', label: 'Generated scene' }],
    isPending: false,
    isError: false,
  })),
}));

afterEach(cleanup);

describe('mock space windows', () => {
  it('shows generated messages for the selected room', () => {
    render(<ChatWindow spaceId="space-1" roomId="room-1" />);
    expect(screen.getByText('Generated sender')).toBeDefined();
    expect(screen.getByText('Generated message')).toBeDefined();
  });

  it('filters chat records from the contextual toolbar query', () => {
    render(<ChatWindow spaceId="space-1" roomId="room-1" query="missing" />);
    expect(screen.getByText('没有匹配的聊天记录')).toBeDefined();
    expect(screen.queryByText('Generated message')).toBeNull();
  });

  it('shows API character data without a local input', () => {
    render(<CharactersWindow spaceId="space-1" />);
    expect(screen.getByText('Generated mask')).toBeDefined();
    expect(screen.getByText('1 张角色卡')).toBeDefined();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('filters space characters from the contextual toolbar query', () => {
    render(<CharactersWindow spaceId="space-1" query="missing" />);
    expect(screen.getByText('没有匹配的空间角色')).toBeDefined();
    expect(screen.queryByText('Generated mask')).toBeNull();
  });

  it('shows API clue data and manages initiative order', () => {
    render(<CluesWindow spaceId="space-1" />);
    expect(screen.getByText('Generated clue')).toBeDefined();
    cleanup();
    render(<CombatWindow spaceId="space-1" />);
    expect(screen.getByText('先攻列表是空的')).toBeDefined();

    fireEvent.change(screen.getByRole('combobox', { name: '战斗单位' }), {
      target: { value: '调查员' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '先攻' }), {
      target: { value: '18' },
    });
    fireEvent.click(screen.getByRole('button', { name: '加入' }));
    expect(screen.getByText('调查员')).toBeDefined();
    expect(screen.getByText('18')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '移除调查员' }));
    expect(screen.getByText('先攻列表是空的')).toBeDefined();
  });

  it('filters members, clues, and combatants from their toolbar queries', () => {
    render(<MembersWindow spaceId="space-1" query="missing" />);
    expect(screen.getByText('没有匹配的空间成员')).toBeDefined();
    cleanup();

    render(<CluesWindow spaceId="space-1" query="missing" />);
    expect(screen.getByText('没有匹配的线索')).toBeDefined();
    cleanup();

    render(<CombatWindow spaceId="space-1" query="missing" />);
    fireEvent.change(screen.getByRole('combobox', { name: '战斗单位' }), {
      target: { value: 'Generated mask' },
    });
    fireEvent.click(screen.getByRole('button', { name: '加入' }));
    expect(screen.getByText('没有匹配的参战角色')).toBeDefined();
  });

  it('places the current label on a map cell', () => {
    render(<MapWindow spaceId="space-1" roomId="room-1" />);
    const cell = screen.getByRole('button', { name: '格子 2' });
    fireEvent.click(cell);
    expect(cell.textContent).toBe('甲');
    expect(cell.getAttribute('aria-label')).toBe('格子 2，甲');

    fireEvent.change(screen.getByRole('textbox', { name: '地图标记' }), {
      target: { value: '乙' },
    });
    fireEvent.click(screen.getByRole('button', { name: '格子 3' }));
    expect(screen.getByRole('button', { name: '格子 3，乙' })).toBeDefined();
  });
});
