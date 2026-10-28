import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/users/$userId')({
  component: lazyRouteComponent(() => import('@/features/admin'), 'AdminUserDetail'),
});
