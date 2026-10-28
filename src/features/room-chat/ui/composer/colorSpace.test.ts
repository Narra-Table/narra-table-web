import { describe, expect, it } from 'vitest';
import { hexToHsv, hsvToHex } from './colorSpace';

describe('color wheel space', () => {
  it('maps the primary hues', () => {
    expect(hsvToHex(0, 1, 1)).toBe('#ff0000');
    expect(hsvToHex(120, 1, 1)).toBe('#00ff00');
    expect(hsvToHex(240, 1, 1)).toBe('#0000ff');
    expect(hsvToHex(0, 0, 1)).toBe('#ffffff');
    expect(hsvToHex(0, 0, 0)).toBe('#000000');
  });

  it('round-trips a custom color', () => {
    const hsv = hexToHsv('#9a3412');
    expect(hsv).not.toBeNull();
    expect(hsvToHex(hsv!.h, hsv!.s, hsv!.v)).toBe('#9a3412');
  });
});
