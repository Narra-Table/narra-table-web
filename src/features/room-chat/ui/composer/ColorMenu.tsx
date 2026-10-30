import { ChevronDown, Pipette, RotateCcw } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/classNames';
import { useThemePalette } from '../../hooks/useThemePalette';
import { paintCustomColor, readableTextColor } from '../../model/contrast';
import { isThemeColor, normalizeColor } from '../../model/richText';
import {
  drawWheel,
  readWheel,
  resolveFill,
  sampleScreen,
  type ColorTarget,
} from './colorMenuModel';
import { BackgroundPresets, QuickPresets, TargetTab } from './ColorPresets';
import { hexToHsv, hsvToHex, type Hsv } from './colorSpace';

const PREVIEW_TEXT = '故桌';

export function ColorMenu({
  color,
  background,
  onTheme,
  onCustom,
  onClear,
  onReset,
  onPrepare,
}: {
  color: string;
  background: string;
  onTheme: (target: ColorTarget, value: string) => void;
  onCustom: (target: ColorTarget, hex: string) => void;
  onClear: (target: ColorTarget) => void;
  onReset: () => void;
  onPrepare: () => void;
}) {
  const panelId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hexFocused = useRef(false);
  const dragging = useRef(false);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<ColorTarget>('text');
  const [canSample, setCanSample] = useState(false);
  const [hexDraft, setHexDraft] = useState('');
  const [hsv, setHsv] = useState<Hsv>({ h: 0, s: 0, v: 1 });

  const palette = useThemePalette();
  const active = target === 'text' ? color : background;
  const custom = active.startsWith('#') ? active : '';
  const textFill = resolveFill(color);
  const backgroundFill = resolveFill(background);
  const backgroundHex = background
    ? isThemeColor(background)
      ? palette[background]
      : background
    : undefined;
  const textHex = color ? (isThemeColor(color) ? palette[color] : color) : undefined;
  // 预览和阅读流用同一套规则：有底色时按底色取文字对比度。
  const previewTextColor = backgroundHex
    ? textHex
      ? paintCustomColor(textHex, backgroundHex)
      : readableTextColor(backgroundHex)
    : textHex
      ? isThemeColor(color)
        ? textHex
        : paintCustomColor(textHex, palette.appBg)
      : palette.text;

  useEffect(() => {
    setCanSample('EyeDropper' in window);
  }, []);

  useEffect(() => {
    if (dragging.current) return;
    if (!custom) {
      setHsv({ h: 0, s: 0, v: 1 });
      return;
    }
    const next = hexToHsv(custom);
    if (next) setHsv(next);
  }, [custom, target]);

  useEffect(() => {
    if (hexFocused.current) return;
    setHexDraft(custom ? custom.toUpperCase() : '');
  }, [custom, target]);

  useLayoutEffect(() => {
    if (!open || !canvasRef.current) return;
    drawWheel(canvasRef.current);
  }, [open]);

  function apply(next: Hsv, drag: boolean) {
    if (drag) dragging.current = true;
    setHsv(next);
    onPrepare();
    onCustom(target, hsvToHex(next.h, next.s, next.v));
  }

  function updateHex(value: string) {
    const digits = value
      .replace(/^#/, '')
      .replace(/[^0-9a-fA-F]/g, '')
      .slice(0, 6)
      .toUpperCase();
    setHexDraft(digits ? `#${digits}` : '');
    if (digits.length !== 6) return;
    const normalized = normalizeColor(`#${digits}`);
    if (!normalized) return;
    onPrepare();
    onCustom(target, normalized);
  }

  function toggle() {
    if (!open) setTarget(color || !background ? 'text' : 'background');
    setOpen((current) => !current);
  }

  function nudgeWheel(event: KeyboardEvent<HTMLCanvasElement>) {
    const step = event.shiftKey ? 0.02 : 0.08;
    if (event.key === 'ArrowLeft') apply({ ...hsv, h: (hsv.h - 8 + 360) % 360 }, false);
    else if (event.key === 'ArrowRight') apply({ ...hsv, h: (hsv.h + 8) % 360 }, false);
    else if (event.key === 'ArrowUp') apply({ ...hsv, s: Math.min(1, hsv.s + step) }, false);
    else if (event.key === 'ArrowDown') apply({ ...hsv, s: Math.max(0, hsv.s - step) }, false);
    else return;
    event.preventDefault();
  }

  function nudgeLightness(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown')
      apply({ ...hsv, v: Math.max(0, hsv.v - 0.05) }, false);
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp')
      apply({ ...hsv, v: Math.min(1, hsv.v + 0.05) }, false);
    else if (event.key === 'Home') apply({ ...hsv, v: 0 }, false);
    else if (event.key === 'End') apply({ ...hsv, v: 1 }, false);
    else return;
    event.preventDefault();
  }

  const marker = custom
    ? {
        left: `${50 + Math.cos((hsv.h * Math.PI) / 180) * hsv.s * 50}%`,
        top: `${50 + Math.sin((hsv.h * Math.PI) / 180) * hsv.s * 50}%`,
      }
    : null;
  const targetLabel = target === 'text' ? '文字颜色' : '文字底色';

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? '收起颜色设置' : '展开颜色设置'}
        className={cn(
          'flex items-center gap-2 rounded-control px-2 py-1.5 text-sm text-text transition-colors',
          open ? 'bg-surface-muted' : 'hover:bg-surface-muted',
        )}
        onClick={toggle}
      >
        <span
          aria-hidden="true"
          className="relative size-4 border border-border"
          style={{ background: backgroundFill ?? 'var(--theme-surface-muted)' }}
        >
          <span className="absolute inset-1" style={{ background: previewTextColor }} />
        </span>
        颜色
        <ChevronDown
          className={cn(
            'icon-stroke ml-auto size-4 text-text-muted transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      <div className="flex flex-col gap-1">
        <QuickPresets label="文字" active={color} onPick={(theme) => onTheme('text', theme)} />
        <BackgroundPresets
          background={background}
          onPick={(hex) => onCustom('background', hex)}
          onClear={() => onClear('background')}
        />
      </div>

      {open ? (
        <div id={panelId} className="flex flex-col gap-3 border-t border-border-subtle pt-3">
          <div
            role="group"
            aria-label="颜色作用范围"
            className="grid grid-cols-2 gap-1 rounded-control bg-surface-muted p-1"
          >
            <TargetTab
              label="文字"
              active={target === 'text'}
              fill={textFill}
              onClick={() => setTarget('text')}
            />
            <TargetTab
              label="底色"
              active={target === 'background'}
              fill={backgroundFill}
              onClick={() => setTarget('background')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-2xs text-text-muted">自定义</p>
            <div className="flex gap-3">
              <div className="flex w-26 shrink-0 flex-col gap-2">
                <div className="relative size-26">
                  <canvas
                    ref={canvasRef}
                    aria-label={`${targetLabel}色轮，方向键调色相和饱和度`}
                    tabIndex={0}
                    className="size-26 cursor-crosshair touch-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    onKeyDown={nudgeWheel}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.currentTarget.setPointerCapture(event.pointerId);
                      apply(readWheel(event, hsv.v), true);
                    }}
                    onPointerMove={(event) => {
                      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                      apply(readWheel(event, hsv.v), true);
                    }}
                    onPointerUp={() => {
                      dragging.current = false;
                    }}
                    onPointerCancel={() => {
                      dragging.current = false;
                    }}
                  />
                  {marker ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 border-2 border-surface ring-1 ring-border"
                      style={{ left: marker.left, top: marker.top }}
                    />
                  ) : null}
                </div>
                <div
                  role="slider"
                  aria-label="明度"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(hsv.v * 100)}
                  aria-valuetext={`${Math.round(hsv.v * 100)}%`}
                  tabIndex={0}
                  className="relative flex h-5 w-full touch-none items-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onKeyDown={nudgeLightness}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    const rect = event.currentTarget.getBoundingClientRect();
                    const value = Math.min(
                      1,
                      Math.max(0, (event.clientX - rect.left) / rect.width),
                    );
                    apply({ ...hsv, v: value }, true);
                  }}
                  onPointerMove={(event) => {
                    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                    const rect = event.currentTarget.getBoundingClientRect();
                    const value = Math.min(
                      1,
                      Math.max(0, (event.clientX - rect.left) / rect.width),
                    );
                    apply({ ...hsv, v: value }, true);
                  }}
                  onPointerUp={() => {
                    dragging.current = false;
                  }}
                  onPointerCancel={() => {
                    dragging.current = false;
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="h-2 w-full border border-border"
                    style={{
                      background: `linear-gradient(to right, #000000, ${hsvToHex(hsv.h, hsv.s, 1)})`,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 border border-border bg-surface"
                    style={{ left: `${hsv.v * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div
                  aria-label="颜色预览"
                  className="grid flex-1 place-items-center rounded-control border border-border text-xl font-medium"
                  style={{
                    color: previewTextColor,
                    background: backgroundFill ?? 'var(--theme-surface-muted)',
                  }}
                >
                  {PREVIEW_TEXT}
                </div>
                <button
                  type="button"
                  disabled={!canSample}
                  title={canSample ? '从屏幕取色' : '当前浏览器不支持屏幕取色'}
                  className="flex items-center justify-center gap-1.5 rounded-control border border-border px-2 py-1.5 text-xs text-text transition-colors hover:bg-surface-muted disabled:opacity-50"
                  onClick={() => {
                    void sampleScreen().then((hex) => {
                      if (!hex || isThemeColor(hex)) return;
                      onPrepare();
                      onCustom(target, hex);
                    });
                  }}
                >
                  <Pipette className="icon-stroke size-3.5" />
                  取色
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                aria-label="十六进制颜色值"
                value={hexDraft}
                placeholder="#RRGGBB"
                autoComplete="off"
                spellCheck={false}
                maxLength={7}
                onChange={(event) => updateHex(event.target.value)}
                onFocus={() => {
                  hexFocused.current = true;
                }}
                onBlur={() => {
                  hexFocused.current = false;
                  if (!hexDraft.trim()) {
                    if (custom) {
                      onPrepare();
                      onClear(target);
                    }
                    return;
                  }
                  setHexDraft(custom ? custom.toUpperCase() : '');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                  if (event.key === 'Escape') {
                    setHexDraft(custom ? custom.toUpperCase() : '');
                    event.currentTarget.blur();
                  }
                }}
                className="min-w-0 flex-1 rounded-control border border-border bg-surface-muted px-2 py-1.5 text-xs tabular-nums text-text outline-none transition-colors placeholder:text-text-muted focus:border-accent"
              />
              <button
                type="button"
                aria-label="清除文字颜色和底色，恢复默认"
                disabled={!color && !background}
                className="flex shrink-0 items-center gap-1 rounded-control px-2 py-1.5 text-xs text-text-muted transition-colors hover:bg-surface-muted hover:text-text disabled:opacity-40"
                onClick={onReset}
              >
                <RotateCcw className="icon-stroke size-3.5" />
                恢复默认
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
