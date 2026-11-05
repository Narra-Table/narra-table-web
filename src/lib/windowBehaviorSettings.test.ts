import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getWindowEdgeAutoScroll,
  saveWindowEdgeAutoScroll,
  WINDOW_EDGE_AUTO_SCROLL_STORAGE_KEY,
} from './windowBehaviorSettings';

describe('window behavior settings', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps edge auto-scroll disabled by default', () => {
    expect(getWindowEdgeAutoScroll()).toBe(false);
  });

  it('persists the edge auto-scroll preference', () => {
    saveWindowEdgeAutoScroll(true);

    expect(values.get(WINDOW_EDGE_AUTO_SCROLL_STORAGE_KEY)).toBe('true');
    expect(getWindowEdgeAutoScroll()).toBe(true);
  });
});
