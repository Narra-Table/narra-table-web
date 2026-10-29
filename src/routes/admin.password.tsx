import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/password')({
  component: lazyRouteComponent(() => import('@/features/admin'), 'AdminPassword'),
});
