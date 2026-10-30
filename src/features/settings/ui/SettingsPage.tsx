import { useRouter, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { type AppTheme, getStoredTheme, saveTheme } from '@/lib/appTheme';
import {
  getStoredSpaceCardLayout,
  saveSpaceCardLayout,
  type SpaceCardLayout,
} from '@/lib/spaceCardLayout';
import type { SettingsSection } from '../model/types';
import { SettingsSurface } from './SettingsSurface';

export function SettingsPage() {
  const { section } = useSearch({ from: '/_app/settings' });
  const router = useRouter();
  const [theme, setTheme] = useState<AppTheme>(getStoredTheme);
  const [spaceCardLayout, setSpaceCardLayout] = useState<SpaceCardLayout>(getStoredSpaceCardLayout);

  function handleThemeChange(next: AppTheme) {
    saveTheme(next);
    setTheme(next);
  }

  function handleSectionChange(next: SettingsSection) {
    void router.navigate({ to: '/settings', search: { section: next } });
  }

  function handleSpaceCardLayoutChange(next: SpaceCardLayout) {
    saveSpaceCardLayout(next);
    setSpaceCardLayout(next);
  }

  return (
    <SettingsSurface
      theme={theme}
      onThemeChange={handleThemeChange}
      spaceCardLayout={spaceCardLayout}
      onSpaceCardLayoutChange={handleSpaceCardLayoutChange}
      section={section}
      onSectionChange={handleSectionChange}
    />
  );
}
