import { createFileRoute } from '@tanstack/react-router';
import { LogOut, Palette, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const themeOptions = [
  { backgroundTheme: 'pure-white', id: 'pure-white', label: '纯白主题' },
  { backgroundTheme: 'warm', id: 'brown', label: '暖棕主题' },
  { backgroundTheme: 'warm', id: 'pink', label: '桃粉主题' },
  { backgroundTheme: 'black-green', id: 'black-green', label: '黑绿主题' },
  { backgroundTheme: 'black-blue', id: 'black-blue', label: '黑蓝主题' },
  { backgroundTheme: 'ink-gold', id: 'ink-gold', label: '墨金主题' },
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

type SettingsSection = 'appearance' | 'profile';

function SettingsPage() {
  const [theme, setTheme] = useState<AppTheme>(getStoredTheme);
  const [section, setSection] = useState<SettingsSection>('appearance');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <SettingsSurface
      theme={theme}
      onThemeChange={setTheme}
      section={section}
      onSectionChange={setSection}
    />
  );
}

function SettingsSurface({
  onThemeChange,
  onSectionChange,
  section,
  theme,
}: {
  onThemeChange: (theme: AppTheme) => void;
  onSectionChange: (section: SettingsSection) => void;
  section: SettingsSection;
  theme: AppTheme;
}) {
  const navItems: { id: SettingsSection; label: string; icon: typeof Palette }[] = [
    { id: 'profile', label: '个人中心', icon: UserRound },
    { id: 'appearance', label: '外观', icon: Palette },
  ];

  return (
    <>
      {/* 移动端：所有分区堆叠在同一页 */}
      <div className="scroll-subtle-native-hidden overflow-auto lg:hidden">
        <div className="flex flex-col gap-10 px-6 py-8">
          {navItems.map(({ id, label }) => (
            <section key={id}>
              <h2 className="mb-6 text-2xl font-bold text-text">{label}</h2>
              {id === 'profile' && <ProfileSettings />}
              {id === 'appearance' && (
                <AppearanceSettings theme={theme} onThemeChange={onThemeChange} />
              )}
            </section>
          ))}
        </div>
      </div>

      {/* 桌面端：侧边栏 + 单分区 */}
      <section className="hidden h-full min-h-0 lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-r border-border-subtle bg-surface-muted/30 p-4">
          <h1 className="px-2 text-sm font-semibold text-text-muted">设置</h1>
          <nav className="mt-4 grid gap-1" aria-label="设置目录">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onSectionChange(id)}
                aria-current={section === id ? 'page' : undefined}
                className={[
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  section === id
                    ? 'bg-surface-muted font-semibold text-text'
                    : 'font-medium text-text-muted hover:bg-surface-muted hover:text-text',
                ].join(' ')}
              >
                <Icon className="size-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border-subtle bg-surface px-6">
            <h1 className="text-base font-semibold">
              {navItems.find((i) => i.id === section)?.label}
            </h1>
          </header>
          <div className="scroll-subtle-native-hidden min-h-0 flex-1 overflow-auto">
            <div className="mx-auto max-w-4xl px-20 py-8">
              {section === 'appearance' && (
                <AppearanceSettings theme={theme} onThemeChange={onThemeChange} />
              )}
              {section === 'profile' && <ProfileSettings />}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ProfileSettings() {
  return (
    <section className="grid gap-8">
      <div className="flex items-center gap-4">
        <Avatar className="size-16 border border-border">
          <AvatarImage src="/avatar.webp" alt="用户头像" />
        </Avatar>
        <div>
          <p className="text-base font-semibold">一只故桌娘</p>
          <p className="mt-0.5 text-sm text-text-muted">@guzhuoniang</p>
        </div>
      </div>
      <div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-control border border-border px-4 py-2 text-sm text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
        >
          <LogOut className="size-4" aria-hidden="true" />
          登出
        </button>
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
      <h2 className="text-xl font-semibold mb-6">主题</h2>
      <p className="mt-2 text-sm text-text-muted mb-6">选择界面配色</p>
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
            'flex w-18 cursor-pointer flex-col overflow-hidden rounded-xl border-2 transition duration-200',
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
