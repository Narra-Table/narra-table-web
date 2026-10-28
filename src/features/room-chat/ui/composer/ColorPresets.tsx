import { Slash } from 'lucide-react';
import { cn } from '@/lib/classNames';
import { THEME_BG_CLASS, THEME_COLORS } from '../../model/richText';
import { BACKGROUND_PRESETS, COLOR_LABEL } from './colorMenuModel';

export function BackgroundPresets({
  background,
  onPick,
  onClear,
}: {
  background: string;
  onPick: (hex: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 shrink-0 text-2xs text-text-muted">底色</span>
      <div role="group" aria-label="底色预设" className="flex items-center gap-1.5">
        {BACKGROUND_PRESETS.map((preset) => (
          <button
            key={preset.hex}
            type="button"
            title={`底色设为${preset.label}`}
            aria-label={`底色设为${preset.label}`}
            aria-pressed={background === preset.hex}
            onClick={() => onPick(preset.hex)}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span
              aria-hidden="true"
              className={cn(
                'block size-5 rounded-full',
                background === preset.hex ? 'ring-2 ring-text' : 'ring-1 ring-border',
              )}
              style={{ background: preset.hex }}
            />
          </button>
        ))}
        <button
          type="button"
          title="无背景"
          aria-label="清除底色"
          aria-pressed={!background}
          onClick={onClear}
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span
            aria-hidden="true"
            className={cn(
              'grid size-5 place-items-center rounded-full border text-text-muted',
              !background ? 'border-text ring-2 ring-text' : 'border-border',
            )}
          >
            <Slash className="size-3" />
          </span>
        </button>
      </div>
    </div>
  );
}

export function QuickPresets({
  label,
  active,
  onPick,
}: {
  label: string;
  active: string;
  onPick: (theme: (typeof THEME_COLORS)[number]) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 shrink-0 text-2xs text-text-muted">{label}</span>
      <div role="group" aria-label={`${label}预设颜色`} className="flex items-center gap-1.5">
        {THEME_COLORS.map((theme) => (
          <button
            key={theme}
            type="button"
            title={`${label}设为${COLOR_LABEL[theme]}色`}
            aria-label={`${label}设为${COLOR_LABEL[theme]}色`}
            aria-pressed={active === theme}
            onClick={() => onPick(theme)}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span
              aria-hidden="true"
              className={cn(
                'block size-5 rounded-full',
                THEME_BG_CLASS[theme],
                active === theme ? 'ring-2 ring-text' : 'ring-1 ring-border',
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function TargetTab({
  label,
  active,
  fill,
  onClick,
}: {
  label: string;
  active: boolean;
  fill?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-control px-2 py-1.5 text-xs transition-colors',
        active ? 'bg-surface font-semibold text-text' : 'text-text-muted hover:text-text',
      )}
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        className="size-3 rounded-full border border-border"
        style={{ background: fill ?? 'var(--theme-surface)' }}
      />
      {label}
    </button>
  );
}
