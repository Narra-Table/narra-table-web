import { createFileRoute, redirect } from '@tanstack/react-router';
import { getAccessToken } from '@/lib/auth';
import { initTheme } from '@/lib/theme';
import { RoomLayout } from '@/views/layouts/RoomLayout';

export const Route = createFileRoute('/_room')({
  beforeLoad: () => {
    initTheme();
    if (!getAccessToken()) throw redirect({ to: '/login' });
  },
  component: RoomLayout,
});
