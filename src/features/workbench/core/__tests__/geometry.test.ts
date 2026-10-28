import { describe, expect, it } from 'vitest';
import {
  clampColumnWidth,
  clampFloatingBox,
  clampScrollOffset,
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_FLOATING_BOX,
  equalHeights,
  insertRowHeights,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  normalizeHeights,
  normalizeNonFullWidth,
  removeRowHeights,
} from '../geometry';

describe('column geometry', () => {
  it('clamps widths and falls back for invalid values', () => {
    expect(clampColumnWidth(0.66)).toBe(0.66);
    expect(clampColumnWidth(0)).toBe(MIN_COLUMN_WIDTH);
    expect(clampColumnWidth(2)).toBe(MAX_COLUMN_WIDTH);
    expect(clampColumnWidth(Number.NaN)).toBe(DEFAULT_COLUMN_WIDTH);
  });

  it('keeps lastNonFullWidth usable and below full width', () => {
    expect(normalizeNonFullWidth(0.4)).toBe(0.4);
    expect(normalizeNonFullWidth(1)).toBe(0.5);
    expect(normalizeNonFullWidth(0)).toBe(MIN_COLUMN_WIDTH);
    expect(normalizeNonFullWidth(undefined, 0.66)).toBe(0.66);
  });
});

describe('row heights', () => {
  it('normalizes valid weights', () => {
    expect(normalizeHeights([2, 3], 2)).toEqual([0.4, 0.6]);
  });

  it('falls back to equal rows for invalid input', () => {
    expect(normalizeHeights(undefined, 3)).toEqual(equalHeights(3));
    expect(normalizeHeights([1, 2], 3)).toEqual(equalHeights(3));
    expect(normalizeHeights([1, 0], 2)).toEqual(equalHeights(2));
  });

  it('splits the focused row 50/50 when inserting', () => {
    const heights = insertRowHeights([1], 1, 0);
    expect(heights).toHaveLength(2);
    expect(heights[0]).toBeCloseTo(0.5);
    expect(heights[1]).toBeCloseTo(0.5);

    const splitTop = insertRowHeights([0.5, 0.5], 2, 0);
    expect(splitTop[0]).toBeCloseTo(0.25);
    expect(splitTop[1]).toBeCloseTo(0.25);
    expect(splitTop[2]).toBeCloseTo(0.5);
  });

  it('redistributes weight when removing a row', () => {
    const heights = removeRowHeights([0.2, 0.3, 0.5], 3, 1);
    expect(heights).toHaveLength(2);
    expect(heights[0]).toBeCloseTo(0.285714, 5);
    expect(heights[1]).toBeCloseTo(0.714286, 5);
    expect(removeRowHeights([1], 1, 0)).toEqual([]);
  });
});

describe('floating geometry', () => {
  it('fills missing fields and enforces a minimum size', () => {
    expect(clampFloatingBox(undefined)).toEqual(DEFAULT_FLOATING_BOX);
    const box = clampFloatingBox({ x: -10, y: Number.NaN, width: 10, height: 10 });
    expect(box.x).toBe(0);
    expect(box.y).toBe(DEFAULT_FLOATING_BOX.y);
    expect(box.width).toBe(240);
    expect(box.height).toBe(160);
  });

  it('clamps scroll offsets to non-negative numbers', () => {
    expect(clampScrollOffset(120)).toBe(120);
    expect(clampScrollOffset(-1)).toBe(0);
    expect(clampScrollOffset(Number.NaN)).toBe(0);
  });
});
