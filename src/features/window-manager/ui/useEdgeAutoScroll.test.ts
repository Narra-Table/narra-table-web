import { describe, expect, it } from 'vitest';
import { edgePanSpeed } from './useEdgeAutoScroll';

describe('edgePanSpeed', () => {
  it('moves toward the nearest horizontal edge', () => {
    expect(edgePanSpeed(0, 0, 1000, 80)).toBe(-1);
    expect(edgePanSpeed(1000, 0, 1000, 80)).toBe(1);
    expect(edgePanSpeed(40, 0, 1000, 80)).toBeCloseTo(-0.5);
    expect(edgePanSpeed(960, 0, 1000, 80)).toBeCloseTo(0.5);
  });

  it('stays idle away from the edges', () => {
    expect(edgePanSpeed(500, 0, 1000, 80)).toBe(0);
    expect(edgePanSpeed(0, 0, 1000, 0)).toBe(0);
  });
});
