/** @vitest-environment jsdom */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createWorkbenchStoreForSpace,
  openKind,
  readWorkbenchSnapshot,
  writeWorkbenchSnapshot,
} from '../lib/persistence';
import { createWorkbenchStore } from '../model/window-manager';
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

describe('useWorkbenchPersistence across tabs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  function savedByAnotherTab() {
    const idleStore = createWorkbenchStoreForSpace('shared-space');
    const view = renderHook(() => useWorkbenchPersistence('shared-space', idleStore));
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const editingStore = createWorkbenchStoreForSpace('shared-space');
    openKind(editingStore, 'map');
    writeWorkbenchSnapshot('shared-space', editingStore);
    return { view, latestLayout: readWorkbenchSnapshot('shared-space') };
  }

  it('keeps the layout saved by another tab when an idle tab unmounts', () => {
    const { view, latestLayout } = savedByAnotherTab();
    view.unmount();
    expect(readWorkbenchSnapshot('shared-space')).toEqual(latestLayout);
  });

  it('keeps the layout saved by another tab when an idle tab is hidden', () => {
    const { latestLayout } = savedByAnotherTab();
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(readWorkbenchSnapshot('shared-space')).toEqual(latestLayout);
  });

  it('still writes a pending local edit when the tab unmounts', () => {
    const store = createWorkbenchStoreForSpace('shared-space');
    const view = renderHook(() => useWorkbenchPersistence('shared-space', store));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const saved = readWorkbenchSnapshot('shared-space');

    act(() => {
      openKind(store, 'map');
    });
    view.unmount();

    const next = readWorkbenchSnapshot('shared-space');
    expect(next).not.toEqual(saved);
    expect(windowCount(next)).toBe(windowCount(saved) + 1);
  });
});

function windowCount(snapshot: unknown): number {
  if (!snapshot || typeof snapshot !== 'object') return 0;
  const windows = (snapshot as { windows?: unknown }).windows;
  return Array.isArray(windows) ? windows.length : 0;
}
