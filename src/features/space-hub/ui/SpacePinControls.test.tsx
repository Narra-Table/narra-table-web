/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SpaceListItem } from '../model/types';
import { FeaturedSpaceStage } from './FeaturedSpaceStage';
import { SpaceCard } from './SpaceCard';

const navigate = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));

const space: SpaceListItem = {
  createdAt: '2026-01-01T00:00:00Z',
  lastActiveAt: '2026-01-02T00:00:00Z',
  memberCount: 3,
  name: '迷雾庄园',
  ownerId: 'user-1',
  spaceId: 'space-1',
  status: 'active',
};

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe('space hub pin controls', () => {
  it('toggles a card pin without entering the space', () => {
    const onTogglePin = vi.fn();
    const view = render(
      <SpaceCard
        space={space}
        layoutHash={0}
        cardLayout="portrait"
        fallbackLandscape={false}
        pinned={false}
        onTogglePin={onTogglePin}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '更多' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '置顶空间' }));

    expect(onTogglePin).toHaveBeenCalledOnce();
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.queryByText('编辑空间信息')).toBeNull();
    expect(screen.queryByText('归档空间')).toBeNull();

    view.rerender(
      <SpaceCard
        space={space}
        layoutHash={0}
        cardLayout="portrait"
        fallbackLandscape={false}
        pinned
        onTogglePin={onTogglePin}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '更多' }));
    expect(screen.getByRole('menuitem', { name: '取消置顶' })).toBeDefined();
  });

  it('toggles the featured pin independently from entering the space', () => {
    const onTogglePin = vi.fn();
    render(<FeaturedSpaceStage space={space} pinned onTogglePin={onTogglePin} />);

    fireEvent.click(screen.getByRole('button', { name: '更多' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '取消置顶' }));
    expect(onTogglePin).toHaveBeenCalledOnce();
    expect(navigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '进入空间' }));
    expect(navigate).toHaveBeenCalledWith({
      to: '/spaces/$spaceId',
      params: { spaceId: 'space-1' },
    });
  });
});
