import { queryOptions } from '@tanstack/react-query';
import {
  getAdminDashboard,
  getAdminUser,
  listAdminPlugins,
  listAdminUsers,
  type AdminUserStatus,
} from './adminClient';

export type AdminUserSearch = {
  page: number;
  status: '' | AdminUserStatus;
  q: string;
};

export const defaultUserSearch: AdminUserSearch = { page: 1, status: '', q: '' };

export const adminRootQuery = queryOptions({
  queryKey: ['admin'],
});

export const adminDashboardQuery = queryOptions({
  queryKey: ['admin', 'dashboard'],
  queryFn: getAdminDashboard,
});

export const adminUserListsQuery = queryOptions({
  queryKey: ['admin', 'users'],
});

export function adminUsersQuery(search: AdminUserSearch) {
  return queryOptions({
    queryKey: ['admin', 'users', search],
    queryFn: () =>
      listAdminUsers({
        page: search.page,
        status: search.status,
        search: search.q,
      }),
  });
}

export function adminUserQuery(userId: string) {
  return queryOptions({
    queryKey: ['admin', 'user', userId],
    queryFn: () => getAdminUser(userId),
  });
}

export const adminPluginsQuery = queryOptions({
  queryKey: ['admin', 'plugins'],
  queryFn: async () => (await listAdminPlugins()).plugins,
});
