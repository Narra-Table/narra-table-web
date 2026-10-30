import { Sun, User } from 'lucide-react';
import type { AppTheme } from '@/lib/appTheme';
import type { SpaceCardLayout } from '@/lib/spaceCardLayout';
import type { SettingsSection } from '../model/types';
import { AppearanceSettings } from './AppearanceSettings';
import { ProfileSettings } from './ProfileSettings';

const navItems: { id: SettingsSection; label: string; icon: typeof Sun }[] = [
  { id: 'profile', label: '个人中心', icon: User },
  { id: 'appearance', label: '外观', icon: Sun },
];

export function SettingsSurface({
  onThemeChange,
  onSpaceCardLayoutChange,
  onSectionChange,
  section,
  spaceCardLayout,
  theme,
}: {
  onThemeChange: (theme: AppTheme) => void;
  onSpaceCardLayoutChange: (layout: SpaceCardLayout) => void;
  onSectionChange: (section: SettingsSection) => void;
  section: SettingsSection;
  spaceCardLayout: SpaceCardLayout;
  theme: AppTheme;
}) {
  return (
    <>
      <div className="scroll-subtle-native-hidden overflow-auto lg:hidden">
        <div className="flex flex-col gap-10 px-6 py-8">
          {navItems.map(({ id, label }) => (
            <section key={id}>
              <h2 className="mb-6 text-2xl font-bold text-text">{label}</h2>
              {id === 'profile' && <ProfileSettings />}
              {id === 'appearance' && (
                <AppearanceSettings
                  theme={theme}
                  onThemeChange={onThemeChange}
                  spaceCardLayout={spaceCardLayout}
                  onSpaceCardLayoutChange={onSpaceCardLayoutChange}
                />
              )}
            </section>
          ))}
        </div>
      </div>

      <section className="hidden h-full min-h-0 lg:grid lg:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="border-r border-border-subtle bg-app-bg p-4">
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
                  <Icon className="icon-stroke size-5 shrink-0" aria-hidden="true" />
                </span>
                <span className="overflow-hidden whitespace-nowrap">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border-subtle bg-surface px-6">
            <h1 className="text-base font-semibold">
              {navItems.find((item) => item.id === section)?.label}
            </h1>
          </header>
          <div className="scroll-subtle-native-hidden min-h-0 flex-1 overflow-auto">
            <div className="mx-auto max-w-4xl px-20 py-8">
              {section === 'appearance' && (
                <AppearanceSettings
                  theme={theme}
                  onThemeChange={onThemeChange}
                  spaceCardLayout={spaceCardLayout}
                  onSpaceCardLayoutChange={onSpaceCardLayoutChange}
                />
              )}
              {section === 'profile' && <ProfileSettings />}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
