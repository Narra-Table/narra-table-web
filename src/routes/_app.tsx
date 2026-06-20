import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppLayout } from '@/features/app-layout/AppLayout';
import { getAccessToken } from '@/lib/auth';

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    if (!getAccessToken()) throw redirect({ to: '/login' });
  },
  component: AppLayout,
});
