import { createFileRoute, redirect } from '@tanstack/react-router';
import { RoomLayout } from '@/features/room-layout/RoomLayout';
import { getAccessToken } from '@/lib/auth';
import { initTheme } from '@/lib/theme';

export const Route = createFileRoute('/_room')({
  beforeLoad: () => {
    initTheme();
    if (!getAccessToken()) throw redirect({ to: '/login' });
  },
  component: RoomLayout,
});
