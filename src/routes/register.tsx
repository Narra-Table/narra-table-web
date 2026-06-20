import { createFileRoute, redirect } from '@tanstack/react-router';
import { RegisterForm } from '@/features/auth/RegisterForm';
import { getAccessToken } from '@/lib/auth';
import { initTheme } from '@/lib/theme';

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    initTheme();
    if (getAccessToken()) throw redirect({ to: '/' });
  },
  component: RegisterForm,
});
