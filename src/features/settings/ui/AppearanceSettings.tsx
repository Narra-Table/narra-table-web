import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AppTheme } from '@/lib/appTheme';
import type { SpaceCardLayout } from '@/lib/spaceCardLayout';
import { themeOptions } from '../model/themeOptions';

export function AppearanceSettings({
  onThemeChange,
  onSpaceCardLayoutChange,
  spaceCardLayout,
  theme,
}: {
  onThemeChange: (theme: AppTheme) => void;
  onSpaceCardLayoutChange: (layout: SpaceCardLayout) => void;
  spaceCardLayout: SpaceCardLayout;
  theme: AppTheme;
}) {
  return (
    <div className="grid gap-10">
      <section>
        <h2 className="text-xl font-semibold">主题</h2>
        <p className="mt-2 text-sm text-text-muted">选择界面配色</p>
        <TooltipProvider delayDuration={300}>
          <div className="mt-5 flex flex-wrap gap-3">
            {themeOptions.map((option) => (
              <ThemeOption
                active={theme === option.id}
                backgroundTheme={option.backgroundTheme}
                key={option.id}
                label={option.label}
                onClick={() => onThemeChange(option.id)}
                theme={option.id}
              />
            ))}
          </div>
        </TooltipProvider>
      </section>

      <section>
        <h2 className="text-xl font-semibold">首页卡片布局</h2>
        <div className="mt-5 grid max-w-xl gap-3 sm:grid-cols-2">
          <LayoutOption
            active={spaceCardLayout === 'portrait'}
            label="全部纵向"
            onClick={() => onSpaceCardLayoutChange('portrait')}
            preview="portrait"
          />
          <LayoutOption
            active={spaceCardLayout === 'mixed'}
            label="横竖混排"
            onClick={() => onSpaceCardLayoutChange('mixed')}
            preview="mixed"
          />
        </div>
      </section>
    </div>
  );
}

function LayoutOption({
  active,
  label,
  onClick,
  preview,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  preview: SpaceCardLayout;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        'cursor-pointer rounded-control border p-3 text-left transition-colors',
        active
          ? 'border-accent bg-surface-muted'
          : 'border-border-subtle hover:border-border hover:bg-surface-muted',
      ].join(' ')}
    >
      <div className="mb-3 flex h-14 items-start gap-2" aria-hidden="true">
        <span className="h-14 w-8 border border-border bg-app-bg" />
        <span
          className={
            preview === 'mixed'
              ? 'h-9 w-16 border border-border bg-app-bg'
              : 'h-12 w-8 border border-border bg-app-bg'
          }
        />
        <span className="h-10 w-8 border border-border bg-app-bg" />
      </div>
      <span className="block text-sm font-semibold text-text">{label}</span>
    </button>
  );
}

function ThemeOption({
  active,
  backgroundTheme,
  label,
  onClick,
  theme,
}: {
  active: boolean;
  backgroundTheme: AppTheme;
  label: string;
  onClick: () => void;
  theme: AppTheme;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          data-theme={theme}
          onClick={onClick}
          className={[
            'flex w-18 cursor-pointer flex-col overflow-hidden rounded-control border-2 transition duration-200',
            active ? 'border-accent' : 'border-border-subtle hover:border-border',
          ].join(' ')}
        >
          <div className="relative h-14 overflow-hidden">
            <div className="absolute inset-0 bg-app-bg" data-theme={backgroundTheme} />
            <div className="absolute bottom-2 left-2.5 right-2.5 h-1.5 bg-accent" />
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
