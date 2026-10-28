import type { PointerEvent } from 'react';
import type { THEME_COLORS } from '../../model/richText';
import { isThemeColor, normalizeColor } from '../../model/richText';
import { hsvToRgb, type Hsv } from './colorSpace';

export type ColorTarget = 'text' | 'background';

export const COLOR_LABEL: Record<(typeof THEME_COLORS)[number], string> = {
  accent: '强调',
  danger: '危险',
  warning: '警告',
  success: '成功',
  info: '信息',
};

export const THEME_SWATCH: Record<(typeof THEME_COLORS)[number], string> = {
  accent: 'var(--theme-accent)',
  danger: 'var(--theme-danger)',
  warning: 'var(--theme-warning)',
  success: 'var(--theme-success)',
  info: 'var(--theme-info)',
};

export const BACKGROUND_PRESETS = [
  { hex: '#fef08a', label: '高亮黄' },
  { hex: '#bbf7d0', label: '高亮绿' },
  { hex: '#bfdbfe', label: '高亮蓝' },
  { hex: '#fbcfe8', label: '高亮粉' },
  { hex: '#fed7aa', label: '高亮橙' },
  { hex: '#1f2937', label: '深色' },
] as const;

export function drawWheel(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const size = Math.max(1, Math.round(canvas.clientWidth * dpr));
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const image = ctx.createImageData(size, size);
  const data = image.data;
  const radius = size / 2;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x + 0.5 - radius;
      const dy = y + 0.5 - radius;
      const dist = Math.hypot(dx, dy) / radius;
      if (dist > 1) continue;
      const hue = (Math.atan2(dy, dx) * 180) / Math.PI;
      const [red, green, blue] = hsvToRgb((hue + 360) % 360, dist, 1);
      const offset = (y * size + x) * 4;
      data[offset] = red;
      data[offset + 1] = green;
      data[offset + 2] = blue;
      data[offset + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

export function readWheel(event: PointerEvent<HTMLCanvasElement>, value: number): Hsv {
  const rect = event.currentTarget.getBoundingClientRect();
  const dx = event.clientX - rect.left - rect.width / 2;
  const dy = event.clientY - rect.top - rect.height / 2;
  const dist = Math.min(1, Math.hypot(dx, dy) / (rect.width / 2));
  const hue = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { h: (hue + 360) % 360, s: dist, v: value };
}

export async function sampleScreen(): Promise<string | null> {
  const host = window as Window & {
    EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
  };
  if (!host.EyeDropper) return null;
  try {
    const result = await new host.EyeDropper().open();
    return normalizeColor(result.sRGBHex) ?? null;
  } catch {
    return null;
  }
}

export function resolveFill(value: string): string | undefined {
  if (isThemeColor(value)) return THEME_SWATCH[value];
  if (value.startsWith('#')) return value;
  return undefined;
}
