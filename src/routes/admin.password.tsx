import { createFileRoute } from '@tanstack/react-router';
import { AdminPassword } from '@/features/admin/AdminPassword';

export const Route = createFileRoute('/admin/password')({
  component: AdminPassword,
});
