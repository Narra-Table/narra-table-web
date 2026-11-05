/** @vitest-environment jsdom */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWindowManagerStore } from '@/features/window-manager';
import {
  createSpaceRuntime,
  openKind,
  readSpaceSnapshot,
  writeSpaceSnapshot,
} from '../lib/persistence';
import { useSpacePersistence } from './useSpacePersistence';

describe('useSpacePersistence', () => {
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
    const store = createWindowManagerStore();
    const view = renderHook(() => useSpacePersistence('space-1', store));

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
    const store = createWindowManagerStore();
    renderHook(() => useSpacePersistence('space-1', store));

    act(() => {
      store.actions.open({ appId: 'narratable', windowTypeId: 'chat', title: '聊天' });
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(setItem).toHaveBeenCalledTimes(1);
  });
});

describe('useSpacePersistence across tabs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  function savedByAnotherTab() {
    const idle = createSpaceRuntime('shared-space');
    const view = renderHook(() => useSpacePersistence('shared-space', idle.manager));
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const editing = createSpaceRuntime('shared-space');
    openKind(editing.workspace, 'map');
    writeSpaceSnapshot('shared-space', editing.manager);
    return { view, latestLayout: readSpaceSnapshot('shared-space') };
  }

  it('keeps the layout saved by another tab when an idle tab unmounts', () => {
    const { view, latestLayout } = savedByAnotherTab();
    view.unmount();
    expect(readSpaceSnapshot('shared-space')).toEqual(latestLayout);
  });

  it('keeps the layout saved by another tab when an idle tab is hidden', () => {
    const { latestLayout } = savedByAnotherTab();
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(readSpaceSnapshot('shared-space')).toEqual(latestLayout);
  });

  it('still writes a pending local edit when the tab unmounts', () => {
    const runtime = createSpaceRuntime('shared-space');
    const view = renderHook(() => useSpacePersistence('shared-space', runtime.manager));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const saved = readSpaceSnapshot('shared-space');

    act(() => {
      openKind(runtime.workspace, 'map');
    });
    view.unmount();

    const next = readSpaceSnapshot('shared-space');
    expect(next).not.toEqual(saved);
    expect(windowCount(next)).toBe(windowCount(saved) + 1);
  });
});

function windowCount(snapshot: unknown): number {
  if (!snapshot || typeof snapshot !== 'object') return 0;
  const windows = (snapshot as { windows?: unknown }).windows;
  return Array.isArray(windows) ? windows.length : 0;
}
