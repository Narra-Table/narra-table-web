import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '@/features/settings/SettingsPage';

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
