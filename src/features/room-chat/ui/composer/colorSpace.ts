export interface Hsv {
  h: number;
  s: number;
  v: number;
}

function byte(value: number): string {
  return Math.min(255, Math.max(0, Math.round(value)))
    .toString(16)
    .padStart(2, '0');
}

export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const hue = (((h % 360) + 360) % 360) / 60;
  const chroma = v * s;
  const x = chroma * (1 - Math.abs((hue % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;
  if (hue < 1) [red, green, blue] = [chroma, x, 0];
  else if (hue < 2) [red, green, blue] = [x, chroma, 0];
  else if (hue < 3) [red, green, blue] = [0, chroma, x];
  else if (hue < 4) [red, green, blue] = [0, x, chroma];
  else if (hue < 5) [red, green, blue] = [x, 0, chroma];
  else [red, green, blue] = [chroma, 0, x];
  const match = v - chroma;
  return [
    Math.round((red + match) * 255),
    Math.round((green + match) * 255),
    Math.round((blue + match) * 255),
  ];
}

export function hsvToHex(h: number, s: number, v: number): string {
  const [red, green, blue] = hsvToRgb(h, s, v);
  return `#${byte(red)}${byte(green)}${byte(blue)}`;
}

export function hexToHsv(hex: string): Hsv | null {
  const match = /^#([0-9a-f]{6})$/.exec(hex);
  if (!match?.[1]) return null;
  const value = Number.parseInt(match[1], 16);
  const red = ((value >> 16) & 255) / 255;
  const green = ((value >> 8) & 255) / 255;
  const blue = (value & 255) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return { h: hue, s: max === 0 ? 0 : delta / max, v: max };
}
