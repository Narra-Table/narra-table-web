import { createFileRoute } from '@tanstack/react-router';
import { AdminPassword } from '@/features/admin';

export const Route = createFileRoute('/admin/password')({
  component: AdminPassword,
});
