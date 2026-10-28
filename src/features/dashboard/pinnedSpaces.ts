import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'narra-pinned-spaces';
const EMPTY_PINNED: string[] = [];

let pinnedIds: string[] = EMPTY_PINNED;
let loaded = false;
const listeners = new Set<() => void>();

export function nextPinnedIds(current: readonly string[], spaceId: string): string[] {
  return current.includes(spaceId) ? current.filter((id) => id !== spaceId) : [spaceId, ...current];
}

export function sortSpacesByPin<T extends { spaceId?: string }>(
  spaces: readonly T[],
  pinned: readonly string[],
): T[] {
  const rank = new Map(pinned.map((id, index) => [id, index]));
  return spaces
    .map((space, index) => ({ space, index }))
    .sort((left, right) => {
      const leftRank = rank.get(left.space.spaceId ?? '') ?? Number.POSITIVE_INFINITY;
      const rightRank = rank.get(right.space.spaceId ?? '') ?? Number.POSITIVE_INFINITY;
      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.index - right.index;
    })
    .map((item) => item.space);
}

function readPinnedSpaceIds(): string[] {
  if (typeof localStorage === 'undefined') return EMPTY_PINNED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PINNED;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_PINNED;
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return EMPTY_PINNED;
  }
}

function ensureLoaded() {
  if (loaded) return;
  pinnedIds = readPinnedSpaceIds();
  loaded = true;
}

function publish(next: string[]) {
  pinnedIds = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 隐私模式下只保留内存里的置顶顺序。
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot() {
  ensureLoaded();
  return pinnedIds;
}

export function usePinnedSpaceIds(): string[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY_PINNED);
}

export function togglePinnedSpace(spaceId: string) {
  ensureLoaded();
  publish(nextPinnedIds(pinnedIds, spaceId));
}

export function unpinSpace(spaceId: string) {
  ensureLoaded();
  if (!pinnedIds.includes(spaceId)) return;
  publish(pinnedIds.filter((id) => id !== spaceId));
}
