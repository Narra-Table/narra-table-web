import { createFileRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';
import { getAdminSession } from '@/lib/adminSession';
import { initTheme } from '@/lib/appTheme';

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ location }) => {
    initTheme();
    const session = getAdminSession();
    if (!session) throw redirect({ to: '/admin/login', search: { changed: false } });
    if (session.forceChangePassword && location.pathname !== '/admin/password') {
      throw redirect({ to: '/admin/password' });
    }
  },
  component: lazyRouteComponent(() => import('@/features/admin'), 'AdminShell'),
});
