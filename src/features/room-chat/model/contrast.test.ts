import { describe, expect, it } from 'vitest';
import { contrastRatio, hueDistance, oklchOf, paintCustomColor } from './contrast';

describe('paintCustomColor', () => {
  it('leaves a readable color unchanged', () => {
    expect(paintCustomColor('#15110d', '#fff6f1')).toBe('#15110d');
  });

  it('changes only lightness until the painted color clears 4.5:1', () => {
    const stored = '#f8d7e3';
    const background = '#fff6f1';
    const painted = paintCustomColor(stored, background);
    expect(painted).not.toBe(stored);
    expect(contrastRatio(painted, background)).toBeGreaterThanOrEqual(4.5);
    const before = oklchOf(stored);
    const after = oklchOf(painted);
    expect(before && after ? hueDistance(before.h, after.h) : 999).toBeLessThan(8);
  });

  it('lightens a dark custom color on a dark background', () => {
    const stored = '#2a2420';
    const background = '#171717';
    const painted = paintCustomColor(stored, background);
    expect(contrastRatio(painted, background)).toBeGreaterThanOrEqual(4.5);
    expect(painted).not.toBe(stored);
  });

  it('does not rewrite the stored string', () => {
    const stored = '#fff6f1';
    paintCustomColor(stored, '#fff6f1');
    expect(stored).toBe('#fff6f1');
  });
});
