import { describe, expect, it, vi } from 'vitest';
import { selectColumns } from '../selectors';
import { serializeWorkspace } from '../snapshot';
import { createEmptyWorkspace } from '../state';
import { createWorkbenchStore } from '../store';
import { idFactory, windowInput } from './helpers';

describe('workbench store', () => {
  it('starts empty and notifies only when state changes', () => {
    const store = createWorkbenchStore({ createId: idFactory() });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    expect(store.getState().containers).toEqual([]);
    const id = store.actions.open(windowInput({ title: 'A' }));
    expect(listener).toHaveBeenCalledTimes(1);

    const before = store.getState();
    store.actions.focus(id);
    expect(store.getState()).toBe(before);
    expect(listener).toHaveBeenCalledTimes(1);

    const column = selectColumns(store.getState())[0];
    store.actions.setWidth(column?.id ?? '', 0.7);
    expect(store.getState()).not.toBe(before);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    store.actions.setWidth(column?.id ?? '', 0.8);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('returns the existing instance for singleton opens', () => {
    const store = createWorkbenchStore({ createId: idFactory() });
    const first = store.actions.open(
      windowInput({ appId: 'chat', windowTypeId: 'room', singleton: true }),
    );
    const second = store.actions.open(
      windowInput({ appId: 'chat', windowTypeId: 'room', singleton: true }),
    );
    expect(second).toBe(first);
    expect(Object.keys(store.getState().windows)).toHaveLength(1);
  });

  it('dispatches named actions and normalizes replace', () => {
    const store = createWorkbenchStore({ createId: idFactory() });
    const id = store.actions.open(windowInput({ title: 'A' }));
    store.dispatch({ type: 'window/set-attention', instanceId: id, level: 'info' });
    expect(store.getState().windows[id]?.attention?.level).toBe('info');

    store.replace(createEmptyWorkspace());
    expect(store.getState().containers).toEqual([]);
  });

  it('restores snapshots and rejects unsupported payloads', () => {
    const source = createWorkbenchStore({ createId: idFactory() });
    source.actions.open(windowInput({ title: 'A' }));
    const snapshot = source.getSnapshot();

    const target = createWorkbenchStore({ createId: idFactory() });
    expect(target.restore(snapshot)).toBe(true);
    expect(target.getSnapshot()).toEqual(snapshot);

    expect(target.restore({ version: 2 })).toBe(false);
    expect(target.restoreJson('{')).toBe(false);
    expect(target.restoreJson(JSON.stringify(snapshot))).toBe(true);
  });

  it('exposes stringify and snapshot helpers', () => {
    const store = createWorkbenchStore({ createId: idFactory() });
    store.actions.open(windowInput({ title: 'A' }));
    const snapshot = store.getSnapshot();
    expect(snapshot.windows[0]?.title).toBe('A');
    expect(JSON.parse(store.stringify())).toEqual(snapshot);
  });

  it('uses the injected id factory', () => {
    const store = createWorkbenchStore({ createId: idFactory(100) });
    const id = store.actions.open(windowInput());
    expect(id).toBe('win-101');
  });

  it('keeps getSnapshot consistent with getState', () => {
    const store = createWorkbenchStore({ createId: idFactory() });
    store.actions.open(windowInput({ title: 'A' }));
    expect(store.getSnapshot()).toEqual(serializeWorkspace(store.getState()));
  });
});
