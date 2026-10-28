import type { FloatingBox } from './types';

/** Smallest usable column width as a fraction of the usable viewport. */
export const MIN_COLUMN_WIDTH = 0.2;
export const MAX_COLUMN_WIDTH = 1;
export const DEFAULT_COLUMN_WIDTH = 0.5;
export const WIDTH_PRESETS = [1 / 3, 1 / 2, 2 / 3, 1] as const;

export const MIN_FLOATING_WIDTH = 240;
export const MIN_FLOATING_HEIGHT = 160;
export const DEFAULT_FLOATING_BOX: FloatingBox = {
  x: 96,
  y: 96,
  width: 520,
  height: 380,
};

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Widths are fractions; a missing or invalid value falls back to `fallback`. */
export function clampColumnWidth(value: unknown, fallback = DEFAULT_COLUMN_WIDTH): number {
  if (!isFiniteNumber(value)) return clamp(fallback, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
  return clamp(value, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
}

export function isFullWidth(width: number): boolean {
  return width >= MAX_COLUMN_WIDTH - 1e-9;
}

/** `lastNonFullWidth` must stay usable and strictly below full width. */
export function normalizeNonFullWidth(value: unknown, fallback = DEFAULT_COLUMN_WIDTH): number {
  if (!isFiniteNumber(value) || value >= MAX_COLUMN_WIDTH) {
    return clamp(fallback, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH - 0.01);
  }
  return clamp(value, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH - 0.01);
}

export function equalHeights(count: number): number[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, () => 1 / count);
}

/**
 * Row weights always have one entry per window and sum to 1. Invalid input
 * falls back to equal rows.
 */
export function normalizeHeights(heights: readonly number[] | undefined, count: number): number[] {
  if (count <= 0) return [];
  if (
    !heights ||
    heights.length !== count ||
    heights.some((height) => !isFiniteNumber(height) || height <= 0)
  ) {
    return equalHeights(count);
  }
  const total = heights.reduce((sum, height) => sum + height, 0);
  if (!isFiniteNumber(total) || total <= 0) return equalHeights(count);
  return heights.map((height) => height / total);
}

/**
 * Insert a row after `index` by splitting that row 50/50. If `index` is past
 * the end, the last row is split; an empty container starts equal.
 */
export function insertRowHeights(
  heights: readonly number[] | undefined,
  count: number,
  index: number,
): number[] {
  if (count <= 0) return [1];
  const base = normalizeHeights(heights, count);
  const splitAt = clamp(Math.trunc(index), 0, count - 1);
  const current = base[splitAt] ?? 1 / count;
  const half = current / 2;
  const next = [...base];
  next.splice(splitAt, 1, half, half);
  return normalizeHeights(next, count + 1);
}

/** Remove a row and redistribute its weight proportionally. */
export function removeRowHeights(
  heights: readonly number[] | undefined,
  count: number,
  index: number,
): number[] {
  if (count <= 1) return [];
  const base = normalizeHeights(heights, count);
  const removeAt = clamp(Math.trunc(index), 0, count - 1);
  const next = base.filter((_, position) => position !== removeAt);
  if (next.length <= 1) return [];
  return normalizeHeights(next, next.length);
}

export function clampScrollOffset(value: unknown, fallback = 0): number {
  if (!isFiniteNumber(value)) return Math.max(0, fallback);
  return Math.max(0, value);
}

export function clampFloatingBox(box: Partial<FloatingBox> | undefined): FloatingBox {
  const source = box ?? {};
  return {
    x: isFiniteNumber(source.x) ? Math.max(0, source.x) : DEFAULT_FLOATING_BOX.x,
    y: isFiniteNumber(source.y) ? Math.max(0, source.y) : DEFAULT_FLOATING_BOX.y,
    width: isFiniteNumber(source.width)
      ? Math.max(MIN_FLOATING_WIDTH, source.width)
      : DEFAULT_FLOATING_BOX.width,
    height: isFiniteNumber(source.height)
      ? Math.max(MIN_FLOATING_HEIGHT, source.height)
      : DEFAULT_FLOATING_BOX.height,
  };
}

/** True when a value is one of the four width presets. */
export function isWidthPreset(value: number): boolean {
  return WIDTH_PRESETS.some((preset) => Math.abs(preset - value) < 1e-9);
}
