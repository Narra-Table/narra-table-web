import { describe, expect, it } from 'vitest';
import { containerScrollLeft } from '../scroll-container';

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
