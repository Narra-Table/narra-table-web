import { createFileRoute, redirect } from '@tanstack/react-router';
import { AdminLogin } from '@/features/admin/AdminLogin';
import { getAdminSession } from '@/lib/adminAuth';
import { initTheme } from '@/lib/theme';

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
  component: AdminLogin,
});
