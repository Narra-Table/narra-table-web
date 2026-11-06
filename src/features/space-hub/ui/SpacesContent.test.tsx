/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { SpacesContent } from './SpacesContent';

const state = vi.hoisted(() => ({ compact: true }));
const spaces = vi.hoisted(() => [
  {
    createdAt: '2026-01-01T00:00:00Z',
    lastActiveAt: '2026-01-02T00:00:00Z',
    memberCount: 3,
    name: '迷雾庄园',
    ownerId: 'user-1',
    spaceId: 'space-1',
    status: 'active',
  },
  {
    createdAt: '2026-01-03T00:00:00Z',
    lastActiveAt: '2026-01-04T00:00:00Z',
    memberCount: 4,
    name: '星港疑云',
    ownerId: 'user-2',
    spaceId: 'space-2',
    status: 'active',
  },
]);

vi.mock('@/api', () => ({ useGetApiSpaces: () => ({ data: spaces, isLoading: false }) }));
vi.mock('@/lib/responsive', () => ({ useMediaQuery: () => state.compact }));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../model/pinnedSpaces', () => ({
  sortSpacesByPin: (items: unknown[]) => items,
  togglePinnedSpace: vi.fn(),
  usePinnedSpaceIds: () => [],
}));
vi.mock('masonry-layout', () => ({
  default: class {
    destroy() {}
    layout() {}
  },
}));

class ResizeObserverMock {
  disconnect() {}
  observe() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

afterEach(cleanup);
afterAll(() => vi.unstubAllGlobals());

describe('SpacesContent responsive layout', () => {
  it('uses cards only on mobile and restores the featured banner on desktop', () => {
    state.compact = true;
    const view = render(<SpacesContent />);

    expect(screen.queryByRole('button', { name: '进入空间' })).toBeNull();
    expect(view.container.querySelectorAll('[data-space-card]')).toHaveLength(2);

    state.compact = false;
    view.rerender(<SpacesContent />);

    expect(screen.getByRole('button', { name: '进入空间' })).toBeDefined();
    expect(view.container.querySelectorAll('[data-space-card]')).toHaveLength(1);
  });
});
