import { describe, expect, it } from 'vitest';
import { containerScrollLeft, edgePanSpeed } from '../scroll-container';

const strip = { scrollLeft: 40, left: 0, right: 800, width: 800 };

describe('containerScrollLeft', () => {
  it('leaves the strip alone when the container is fully inside', () => {
    expect(containerScrollLeft(strip, { left: 100, right: 400, width: 300 })).toBe(40);
  });

  it('pulls a container that hangs off the right edge into the strip', () => {
    expect(containerScrollLeft(strip, { left: 600, right: 980, width: 380 })).toBe(40 + 180);
  });

  it('pulls a container that hangs off the left edge into the strip', () => {
    expect(containerScrollLeft(strip, { left: -50, right: 250, width: 300 })).toBe(40 - 50);
  });

  it('aligns a container wider than the strip to the container leading edge', () => {
    expect(containerScrollLeft(strip, { left: 120, right: 1400, width: 1280 })).toBe(40 + 120);
  });
});

describe('edgePanSpeed', () => {
  it('pans left at full speed at the very left edge', () => {
    expect(edgePanSpeed(0, 0, 1000, 80)).toBe(-1);
  });

  it('pans right at full speed at the very right edge', () => {
    expect(edgePanSpeed(1000, 0, 1000, 80)).toBe(1);
  });

  it('ramps toward zero at the inner border of each zone', () => {
    expect(edgePanSpeed(40, 0, 1000, 80)).toBeCloseTo(-0.5);
    expect(edgePanSpeed(960, 0, 1000, 80)).toBeCloseTo(0.5);
    expect(edgePanSpeed(80, 0, 1000, 80)).toBeCloseTo(0);
    expect(edgePanSpeed(920, 0, 1000, 80)).toBeCloseTo(0);
  });

  it('is idle outside both zones', () => {
    expect(edgePanSpeed(500, 0, 1000, 80)).toBe(0);
  });

  it('is idle when the zone has no width', () => {
    expect(edgePanSpeed(0, 0, 1000, 0)).toBe(0);
  });
});
