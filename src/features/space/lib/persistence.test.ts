import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSpaceRuntime, openKind, writeSpaceSnapshot } from './persistence';

let values: Map<string, string>;

beforeEach(() => {
  values = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, String(value)),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('space persistence', () => {
  it('restores the minimal window layout', () => {
    const runtime = createSpaceRuntime('space-a');
    openKind(runtime.workspace, 'map');
    writeSpaceSnapshot('space-a', runtime.manager);

    const restored = createSpaceRuntime('space-a');
    expect(restored.workspace.listWindows().map((window) => window.windowTypeId)).toEqual([
      'chat',
      'characters',
      'map',
    ]);
  });

  it('rebuilds defaults when a snapshot is incompatible', () => {
    values.set('narratable.space.snapshot.space-a', JSON.stringify({ version: 1 }));
    const runtime = createSpaceRuntime('space-a');
    expect(runtime.workspace.listWindows().map((window) => window.windowTypeId)).toEqual([
      'chat',
      'characters',
    ]);
  });
});
