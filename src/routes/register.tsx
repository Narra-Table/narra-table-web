import { createFileRoute, redirect } from '@tanstack/react-router';
import { RegisterForm } from '@/features/auth';
import { initTheme } from '@/lib/appTheme';
import { getAccessToken } from '@/lib/authSession';

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    initTheme();
    if (getAccessToken()) throw redirect({ to: '/' });
  },
  component: RegisterForm,
});
