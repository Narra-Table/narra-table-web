/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createSequentialIdFactory } from '../core/ids';
import { selectColumns } from '../core/selectors';
import { createWorkbenchStore } from '../core/store';
import { useWorkbenchActions, useWorkbenchSelector, useWorkbenchStore } from './useWorkbench';

function createStore() {
  return createWorkbenchStore({ createId: createSequentialIdFactory() });
}

function openFirst(store: ReturnType<typeof createStore>) {
  return store.actions.open({
    appId: 'demo',
    windowTypeId: 'note',
    title: 'Note',
    width: 0.5,
  });
}

describe('React store bindings', () => {
  it('re-renders when the store changes', () => {
    const store = createStore();
    const { result } = renderHook(() => useWorkbenchStore(store));
    expect(result.current.containers).toHaveLength(0);

    act(() => {
      openFirst(store);
    });
    expect(result.current.containers).toHaveLength(1);
    expect(result.current.focus.focusedWindowId).toBe('win-1');
  });

  it('selects derived values and caches by state identity', () => {
    const store = createStore();
    const { result } = renderHook(() => useWorkbenchSelector(store, selectColumns));
    expect(result.current).toEqual([]);

    act(() => {
      openFirst(store);
    });
    expect(result.current).toHaveLength(1);
    expect(result.current[0]?.windows).toEqual(['win-1']);
  });

  it('exposes the action surface', () => {
    const store = createStore();
    const { result } = renderHook(() => useWorkbenchActions(store));
    expect(result.current).toBe(store.actions);
  });
});
