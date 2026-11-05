/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WindowContent } from './WindowContent';

vi.mock('@/api', () => ({
  useGetApiSpacesSpaceIdRoomsRoomIdScenes: vi.fn(() => ({
    data: [],
    isPending: false,
    isError: false,
  })),
}));

afterEach(cleanup);

describe('WindowContent', () => {
  it('renders the selected local window', () => {
    render(<WindowContent kind="map" spaceId="space-1" activeRoomId="room-1" />);
    expect(screen.getByRole('button', { name: '格子 1' })).toBeDefined();
  });
});
