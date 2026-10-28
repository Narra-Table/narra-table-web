import { createFileRoute, redirect } from '@tanstack/react-router';
import { AdminShell } from '@/features/admin';
import { getAdminSession } from '@/lib/adminAuth';
import { initTheme } from '@/lib/theme';

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ location }) => {
    initTheme();
    const session = getAdminSession();
    if (!session) throw redirect({ to: '/admin/login', search: { changed: false } });
    if (session.forceChangePassword && location.pathname !== '/admin/password') {
      throw redirect({ to: '/admin/password' });
    }
  },
  component: AdminShell,
});
