import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { LogOut, Palette, UserRoundKey } from 'lucide-react';
import { useState } from 'react';
import { useGetApiMe, usePostAuthLogout } from '@/api';
import type { getApiMeResponseSuccess } from '@/api';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { clearAuth } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';
import { type AppTheme, getStoredTheme, saveTheme } from '@/lib/theme';

const themeOptions = [
  { backgroundTheme: 'kraft-teal', id: 'kraft-teal', label: '青绿主题' },
  { backgroundTheme: 'kraft-teal', id: 'kraft-brown', label: '暖棕主题' },
  { backgroundTheme: 'kraft-teal', id: 'kraft-pink', label: '桃粉主题' },
  { backgroundTheme: 'pure-white', id: 'pure-white', label: '黑白主题' },
  { backgroundTheme: 'black-green', id: 'black-green', label: '黑绿主题' },
  { backgroundTheme: 'black-blue', id: 'black-blue', label: '黑蓝主题' },
  { backgroundTheme: 'ink-gold', id: 'ink-gold', label: '墨金主题' },
] as const;

type SettingsSection = 'appearance' | 'profile';

const SECTIONS: SettingsSection[] = ['profile', 'appearance'];

export const Route = createFileRoute('/_app/settings')({
  validateSearch: (search): { section: SettingsSection } => ({
    section: SECTIONS.includes(search.section as SettingsSection)
      ? (search.section as SettingsSection)
      : 'profile',
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { section } = Route.useSearch();
  const router = useRouter();
  const [theme, setTheme] = useState<AppTheme>(getStoredTheme);

  function handleThemeChange(next: AppTheme) {
    saveTheme(next);
    setTheme(next);
  }

  function handleSectionChange(next: SettingsSection) {
    void router.navigate({ to: '/settings', search: { section: next } });
  }

  return (
    <SettingsSurface
      theme={theme}
      onThemeChange={handleThemeChange}
      section={section}
      onSectionChange={handleSectionChange}
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
    { id: 'profile', label: '个人中心', icon: UserRoundKey },
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
      <section className="hidden h-full min-h-0 lg:grid lg:grid-cols-[200px_minmax(0,1fr)]">
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
                  'group grid h-10 w-full cursor-pointer grid-cols-[40px_minmax(0,1fr)] items-center overflow-hidden rounded-card text-left text-base font-normal tracking-normal transition-colors duration-200 hover:bg-surface-muted hover:text-accent',
                  section === id ? 'bg-surface-muted font-semibold text-accent' : 'text-text',
                ].join(' ')}
              >
                <span className="grid size-10 place-items-center">
                  <Icon className="size-5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
                </span>
                <span className="overflow-hidden whitespace-nowrap">{label}</span>
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
  const navigate = useNavigate();
  const { data: user } = useGetApiMe({
    query: { select: (res) => (res as getApiMeResponseSuccess).data },
  });

  const { mutate: logout, isPending } = usePostAuthLogout({
    mutation: {
      onSettled: () => {
        clearAuth();
        queryClient.clear();
        void navigate({ to: '/login' });
      },
    },
  });

  return (
    <section className="grid gap-8">
      <div className="flex items-center gap-4">
        <Avatar className="size-16 border border-border">
          <AvatarImage src={user?.avatar || '/avatar.webp'} alt="用户头像" />
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">{user?.nickname}</p>
          <p className="mt-2 text-sm text-text-muted">@{user?.username}</p>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          disabled={isPending}
          className="flex shrink-0 items-center gap-2 rounded-control border border-danger/40 px-4 py-2 text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
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
