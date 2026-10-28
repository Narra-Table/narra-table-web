import { createFileRoute, redirect } from '@tanstack/react-router';
import { getAccessToken } from '@/lib/authSession';
import { AppLayout } from '@/views/layouts/AppLayout';

export const Route = createFileRoute('/_app')({
  beforeLoad: () => {
    if (!getAccessToken()) throw redirect({ to: '/login' });
  },
  component: AppLayout,
});
