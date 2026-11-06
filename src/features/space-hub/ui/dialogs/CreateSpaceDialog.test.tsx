/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/apiClient';
import { CreateSpaceDialog } from './CreateSpaceDialog';

const api = vi.hoisted(() => ({
  getApiSpacesSpaceId: vi.fn(),
  getApiSpacesSpaceIdRooms: vi.fn(),
  getApiSpacesSpaceIdMasks: vi.fn(),
  patchApiSpacesSpaceId: vi.fn(),
  postApiSpaces: vi.fn(),
  postApiSpacesSpaceIdRooms: vi.fn(),
  postApiSpacesSpaceIdMasks: vi.fn(),
}));
const navigate = vi.hoisted(() => vi.fn());

vi.mock('@/api', () => ({ ...api, getGetApiSpacesQueryKey: () => ['/api/spaces'] }));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));

beforeEach(() => {
  vi.resetAllMocks();
  api.postApiSpaces.mockResolvedValue({ status: 201, data: { spaceId: 'space-1' } });
  api.getApiSpacesSpaceIdRooms.mockResolvedValue({ status: 200, data: { rooms: [] } });
  api.getApiSpacesSpaceIdMasks.mockResolvedValue({ status: 200, data: { masks: [] } });
  api.postApiSpacesSpaceIdRooms.mockResolvedValue({ status: 201, data: {} });
  api.postApiSpacesSpaceIdMasks.mockResolvedValue({ status: 201, data: {} });
});

afterEach(cleanup);

function submitNewSpace() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <CreateSpaceDialog onClose={onClose} />
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByLabelText('名称'), { target: { value: '新空间' } });
  fireEvent.click(screen.getByRole('button', { name: '创建并进入' }));
  return { client, invalidate, onClose };
}

describe('space creation recovery', () => {
  it('retries missing defaults in the same space after a partial failure', async () => {
    api.getApiSpacesSpaceIdRooms
      .mockResolvedValueOnce({ status: 200, data: { rooms: [] } })
      .mockResolvedValue({ status: 200, data: { rooms: [{ type: 'session', roomId: 'room-1' }] } });
    api.postApiSpacesSpaceIdMasks.mockRejectedValueOnce(new ApiError('面具服务暂不可用', 503));
    const { invalidate } = submitNewSpace();

    await screen.findByText('空间已创建，但初始化失败：面具服务暂不可用');
    expect((screen.getByLabelText('名称') as HTMLInputElement).disabled).toBe(true);
    expect(invalidate).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '重试初始化' }));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/spaces/$spaceId',
        params: { spaceId: 'space-1' },
      }),
    );
    expect(api.postApiSpaces).toHaveBeenCalledOnce();
    expect(api.postApiSpacesSpaceIdRooms).toHaveBeenCalledOnce();
    expect(api.postApiSpacesSpaceIdMasks).toHaveBeenCalledTimes(2);
  });

  it('waits for all in-flight defaults before allowing a retry', async () => {
    let finishRoom!: (value: unknown) => void;
    api.postApiSpacesSpaceIdRooms.mockReturnValue(
      new Promise((resolve) => {
        finishRoom = resolve;
      }),
    );
    api.postApiSpacesSpaceIdMasks.mockRejectedValueOnce(new ApiError('面具服务暂不可用', 503));
    submitNewSpace();

    await waitFor(() => expect(api.postApiSpacesSpaceIdMasks).toHaveBeenCalledOnce());
    expect((screen.getByRole('button', { name: '处理中...' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    await act(async () => {
      finishRoom({ status: 201, data: {} });
    });
    await screen.findByRole('button', { name: '重试初始化' });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('keeps keyboard focus in the dialog and restores it on close', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const client = new QueryClient();
    const view = render(
      <QueryClientProvider client={client}>
        <CreateSpaceDialog onClose={vi.fn()} />
      </QueryClientProvider>,
    );
    const first = screen.getByLabelText('名称');
    const last = screen.getByRole('button', { name: '创建并进入' });

    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);

    view.unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
