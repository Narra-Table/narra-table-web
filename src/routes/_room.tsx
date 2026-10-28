import { createFileRoute, redirect } from '@tanstack/react-router';
import { initTheme } from '@/lib/appTheme';
import { getAccessToken } from '@/lib/authSession';
import { RoomLayout } from '@/views/layouts/RoomLayout';

export const Route = createFileRoute('/_room')({
  beforeLoad: () => {
    initTheme();
    if (!getAccessToken()) throw redirect({ to: '/login' });
  },
  component: RoomLayout,
});
