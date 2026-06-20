import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginForm } from '@/features/auth/LoginForm';
import { getAccessToken } from '@/lib/auth';
import { initTheme } from '@/lib/theme';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    initTheme();
    if (getAccessToken()) throw redirect({ to: '/' });
  },
  component: LoginForm,
});
