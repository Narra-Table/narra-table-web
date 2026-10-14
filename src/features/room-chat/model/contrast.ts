const TARGET_CONTRAST = 4.5;

function srgbToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  const encoded = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, encoded)) * 255);
}

function hexChannel(value: number): string {
  return value.toString(16).padStart(2, '0');
}

export function parseColor(input: string): [number, number, number] | null {
  const hex = input.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex?.[1]) {
    return [
      Number.parseInt(hex[1].slice(0, 2), 16),
      Number.parseInt(hex[1].slice(2, 4), 16),
      Number.parseInt(hex[1].slice(4, 6), 16),
    ];
  }
  const rgb = input.trim().match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (!rgb?.[1] || !rgb[2] || !rgb[3]) return null;
  return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
}

function toHex(rgb: [number, number, number]): string {
  return `#${hexChannel(rgb[0])}${hexChannel(rgb[1])}${hexChannel(rgb[2])}`;
}

function relativeLuminance(rgb: [number, number, number]): number {
  return (
    0.2126 * srgbToLinear(rgb[0]) + 0.7152 * srgbToLinear(rgb[1]) + 0.0722 * srgbToLinear(rgb[2])
  );
}

export function contrastRatio(foreground: string, background: string): number {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  if (!fg || !bg) return 1;
  const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg));
  const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

export function oklchOf(color: string): { l: number; c: number; h: number } | null {
  const rgb = parseColor(color);
  if (!rgb) return null;
  const r = srgbToLinear(rgb[0]);
  const g = srgbToLinear(rgb[1]);
  const b = srgbToLinear(rgb[2]);
  const lmsL = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const lmsM = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const lmsS = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const lRoot = Math.cbrt(lmsL);
  const mRoot = Math.cbrt(lmsM);
  const sRoot = Math.cbrt(lmsS);
  const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const bLab = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;
  let h = (Math.atan2(bLab, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return {
    l: 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    c: Math.hypot(a, bLab),
    h,
  };
}

function oklchToHex(l: number, c: number, h: number): string {
  const radians = (h * Math.PI) / 180;
  const a = c * Math.cos(radians);
  const b = c * Math.sin(radians);
  const lRoot = l + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = l - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = l - 0.0894841775 * a - 1.291485548 * b;
  const lmsL = lRoot ** 3;
  const lmsM = mRoot ** 3;
  const lmsS = sRoot ** 3;
  return toHex([
    linearToSrgb(4.0767416621 * lmsL - 3.3077115913 * lmsM + 0.2309699292 * lmsS),
    linearToSrgb(-1.2684380046 * lmsL + 2.6097574011 * lmsM - 0.3413193965 * lmsS),
    linearToSrgb(-0.0041960863 * lmsL - 0.7034186147 * lmsM + 1.707614701 * lmsS),
  ]);
}

function walkLightness(
  oklch: { l: number; c: number; h: number },
  background: string,
  bound: number,
): { hex: string; l: number } {
  for (let step = 1; step <= 32; step += 1) {
    const l = oklch.l + ((bound - oklch.l) * step) / 32;
    const hex = oklchToHex(l, oklch.c, oklch.h);
    if (contrastRatio(hex, background) >= TARGET_CONTRAST) return { hex, l };
  }
  return { hex: oklchToHex(bound, oklch.c, oklch.h), l: bound };
}

export function paintCustomColor(stored: string, background: string): string {
  const normalized = stored.trim().toLowerCase();
  const rgb = parseColor(normalized);
  if (!rgb || !parseColor(background)) return normalized;
  const original = toHex(rgb);
  if (contrastRatio(original, background) >= TARGET_CONTRAST) return original;
  const oklch = oklchOf(original);
  if (!oklch) return original;
  const lighter = walkLightness(oklch, background, 1);
  const darker = walkLightness(oklch, background, 0);
  const chosen = [lighter, darker].sort((left, right) => {
    const leftPass = contrastRatio(left.hex, background) >= TARGET_CONTRAST ? 0 : 1;
    const rightPass = contrastRatio(right.hex, background) >= TARGET_CONTRAST ? 0 : 1;
    if (leftPass !== rightPass) return leftPass - rightPass;
    return Math.abs(left.l - oklch.l) - Math.abs(right.l - oklch.l);
  })[0];
  return chosen?.hex ?? original;
}

export function hueDistance(left: number, right: number): number {
  const distance = Math.abs(left - right) % 360;
  return Math.min(distance, 360 - distance);
}
