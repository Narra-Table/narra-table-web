import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/plugins')({
  component: lazyRouteComponent(() => import('@/features/admin'), 'AdminPlugins'),
});
