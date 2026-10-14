import { createFileRoute } from '@tanstack/react-router';
import { AdminUserDetail } from '@/features/admin/AdminUserDetail';

export const Route = createFileRoute('/admin/users/$userId')({
  component: AdminUserDetail,
});
