import { createFileRoute } from '@tanstack/react-router';
import { Check, Palette } from 'lucide-react';
import { useEffect, useState } from 'react';

const themeOptions = [
  { backgroundTheme: 'warm', id: 'brown', label: '棕色高亮' },
  { backgroundTheme: 'warm', id: 'pink', label: '浅粉高亮' },
  { backgroundTheme: 'black-green', id: 'black-green', label: '黑绿主题' },
  { backgroundTheme: 'black-blue', id: 'black-blue', label: '黑蓝主题' },
] as const;

type AppTheme = 'warm' | (typeof themeOptions)[number]['id'];

const THEME_STORAGE_KEY = 'narra-theme';

export const Route = createFileRoute('/_app/settings')({
  component: SettingsPage,
});

function getStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'warm';

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return isAppTheme(storedTheme) ? storedTheme : 'warm';
}

function isAppTheme(theme: string | null): theme is AppTheme {
  return theme === 'warm' || themeOptions.some((option) => option.id === theme);
}

function SettingsPage() {
  const [theme, setTheme] = useState<AppTheme>(getStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return <SettingsSurface theme={theme} onThemeChange={setTheme} />;
}

function SettingsSurface({
  onThemeChange,
  theme,
}: {
  onThemeChange: (theme: AppTheme) => void;
  theme: AppTheme;
}) {
  return (
    <section className="min-h-full lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden border-r border-border-subtle bg-surface-muted/30 p-4 lg:block">
        <h1 className="px-2 text-sm font-semibold text-text-muted">设置</h1>
        <nav className="mt-4 grid gap-1" aria-label="设置目录">
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg bg-surface-muted px-3 py-2 text-left text-sm font-semibold text-text"
            aria-current="page"
          >
            <Palette className="size-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
            <span>外观</span>
          </button>
        </nav>
      </aside>

      <div className="flex min-h-full min-w-0 flex-col lg:min-h-0">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border-subtle bg-surface px-4 lg:px-6">
          <h1 className="text-base font-semibold">外观</h1>
        </header>

        <div className="scroll-subtle-native-hidden min-h-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
            <AppearanceSettings theme={theme} onThemeChange={onThemeChange} />
          </div>
        </div>
      </div>
    </section>
  );
}

function AppearanceSettings({
  onThemeChange,
  theme,
}: {
  onThemeChange: (theme: AppTheme) => void;
  theme: AppTheme;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">外观</h2>
      <p className="mt-2 text-sm text-text-muted">主题和界面偏好。</p>
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
    <button
      type="button"
      aria-label={label}
      className={[
        'relative size-14 overflow-hidden rounded-lg border-2 bg-app-bg transition',
        active ? 'border-accent' : 'border-border',
      ].join(' ')}
      data-theme={theme}
      onClick={onClick}
      title={label}
    >
      <span className="absolute inset-0 bg-app-bg" data-theme={backgroundTheme} />
      <span
        className={[
          'absolute right-0 top-0 size-7 origin-top-right bg-accent transition-[transform] duration-200 ease-out [clip-path:polygon(0_0,100%_0,100%_100%)]',
          active ? 'scale-100' : 'scale-95',
        ].join(' ')}
        data-theme={theme}
      />
      <span className="absolute right-0 top-0 grid size-7 place-items-start justify-items-end p-0.5">
        <Check
          className={[
            'size-3.5 text-accent-text transition duration-200 ease-out',
            active ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
          ].join(' ')}
          strokeWidth={3}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}
