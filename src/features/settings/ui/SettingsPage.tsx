import { useRouter, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { type AppTheme, getStoredTheme, saveTheme } from '@/lib/appTheme';
import type { SettingsSection } from '../model/types';
import { SettingsSurface } from './SettingsSurface';

export function SettingsPage() {
  const { section } = useSearch({ from: '/_app/settings' });
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
