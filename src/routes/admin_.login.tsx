import { createFileRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';
import { getAdminSession } from '@/lib/adminSession';
import { initTheme } from '@/lib/appTheme';

export const Route = createFileRoute('/admin_/login')({
  validateSearch: (search): { changed: boolean } => ({
    changed: search.changed === true || search.changed === 'true',
  }),
  beforeLoad: () => {
    initTheme();
    const session = getAdminSession();
    if (!session) return;
    if (session.forceChangePassword) throw redirect({ to: '/admin/password' });
    throw redirect({ to: '/admin' });
  },
  component: lazyRouteComponent(() => import('@/features/admin'), 'AdminLogin'),
});
