import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AppTheme } from '@/lib/appTheme';
import { themeOptions } from '../model/themeOptions';

export function AppearanceSettings({
  onThemeChange,
  theme,
}: {
  onThemeChange: (theme: AppTheme) => void;
  theme: AppTheme;
}) {
  return (
    <section>
      <h2 className="mb-6 text-xl font-semibold">主题</h2>
      <p className="mb-6 mt-2 text-sm text-text-muted">选择界面配色</p>
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
            <div className="absolute bottom-2 left-2.5 right-2.5 h-1.5 rounded-full bg-accent" />
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
