import { describe, expect, it } from 'vitest';
import {
  createSequentialIdFactory,
  createWorkbenchStore,
  selectColumns,
} from '@/modules/workbench';
import { openKind } from '../../lib/persistence';
import { isWorkbenchWindowKind, WORKBENCH_APP_ID, WORKBENCH_REGISTRY } from './registry';
import { WINDOW_KINDS } from './windows';

describe('workbench registry', () => {
  it('registers every app window kind', () => {
    for (const kind of WINDOW_KINDS) {
      const descriptor = WORKBENCH_REGISTRY.getWindow(WORKBENCH_APP_ID, kind);
      expect(descriptor).toBeDefined();
      expect(descriptor?.windowTypeId).toBe(kind);
      expect(isWorkbenchWindowKind(kind)).toBe(true);
    }
    expect(isWorkbenchWindowKind('unknown')).toBe(false);
  });

  it('keeps the chat default wider than the other windows', () => {
    const chat = WORKBENCH_REGISTRY.getWindow(WORKBENCH_APP_ID, 'chat');
    const characters = WORKBENCH_REGISTRY.getWindow(WORKBENCH_APP_ID, 'characters');
    expect(chat?.defaultWidth).toBeCloseTo(2 / 3);
    expect(characters?.defaultWidth).toBe(0.5);
  });

  it('opens a kind into the new store', () => {
    const store = createWorkbenchStore({ createId: createSequentialIdFactory() });
    const instanceId = openKind(store, 'chat');
    expect(instanceId).toBeTruthy();
    expect(store.getState().windows[instanceId as string]?.title).toBe('聊天');
    const columns = selectColumns(store.getState());
    expect(columns).toHaveLength(1);
    expect(columns[0]?.width).toBeCloseTo(2 / 3);
  });
});
