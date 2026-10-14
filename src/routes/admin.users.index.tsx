import { createFileRoute } from '@tanstack/react-router';
import { AdminUsers } from '@/features/admin/AdminUsers';
import type { AdminUserStatus } from '@/lib/adminClient';

const statuses = ['', 'active', 'disabled', 'deleted'] as const;

type UserSearch = {
  page: number;
  status: '' | AdminUserStatus;
  q: string;
};

export const Route = createFileRoute('/admin/users/')({
  validateSearch: (search): UserSearch => {
    const page = Number(search.page);
    const status = statuses.includes(search.status as (typeof statuses)[number])
      ? (search.status as UserSearch['status'])
      : '';
    return {
      page: Number.isInteger(page) && page > 0 ? page : 1,
      status,
      q: typeof search.q === 'string' ? search.q : '',
    };
  },
  component: AdminUsers,
});
