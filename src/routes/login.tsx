import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginForm } from '@/features/auth';
import { initTheme } from '@/lib/appTheme';
import { getAccessToken } from '@/lib/authSession';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    initTheme();
    if (getAccessToken()) throw redirect({ to: '/' });
  },
  component: LoginForm,
});
