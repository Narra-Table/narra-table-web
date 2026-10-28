/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorkbenchStore } from '@/modules/workbench';
import { useWorkbenchPersistence } from './useWorkbenchPersistence';

describe('useWorkbenchPersistence', () => {
  const setItem = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    setItem.mockReset();
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => null), setItem });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('coalesces rapid store updates into one snapshot write', () => {
    const store = createWorkbenchStore();
    const view = renderHook(() => useWorkbenchPersistence('space-1', store));

    act(() => {
      store.actions.open({ appId: 'narratable', windowTypeId: 'chat', title: '聊天' });
      store.actions.open({ appId: 'narratable', windowTypeId: 'clues', title: '线索' });
      vi.advanceTimersByTime(119);
    });
    expect(setItem).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(setItem).toHaveBeenCalledTimes(1);

    view.unmount();
  });

  it('flushes pending state when the page is hidden', () => {
    const store = createWorkbenchStore();
    renderHook(() => useWorkbenchPersistence('space-1', store));

    act(() => {
      store.actions.open({ appId: 'narratable', windowTypeId: 'chat', title: '聊天' });
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(setItem).toHaveBeenCalledTimes(1);
  });
});
