import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { AdminUserStatus } from '../api/adminClient';
import { adminUsersQuery } from '../api/adminQueries';
import { adminErrorMessage } from '../model/copy';
import { formatAdminTime } from '../model/formatAdminTime';
import { AdminStatusBadge } from './AdminStatusBadge';

const statuses: { value: '' | AdminUserStatus; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'active', label: '正常' },
  { value: 'disabled', label: '已禁用' },
  { value: 'deleted', label: '已匿名化' },
];

export function AdminUsers() {
  const search = useSearch({ from: '/admin/users/' });
  const navigate = useNavigate({ from: '/admin/users/' });
  const [draft, setDraft] = useState(search.q);
  const users = useQuery(adminUsersQuery(search));

  function updateSearch(next: Partial<typeof search>) {
    void navigate({ search: { ...search, ...next } });
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">用户</h1>
        <p className="mt-2 text-sm text-text-muted">
          可以禁用、恢复、发放一次性临时密码，或在确认后匿名化账号。
        </p>
      </div>
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          updateSearch({ q: draft.trim(), page: 1 });
        }}
      >
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-medium">
          搜索
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="用户名、昵称或邮箱"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          状态
          <Select
            value={search.status}
            onChange={(event) =>
              updateSearch({ status: event.target.value as '' | AdminUserStatus, page: 1 })
            }
          >
            {statuses.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit">查询</Button>
      </form>
      {users.isPending && <p className="text-sm text-text-muted">正在读取用户...</p>}
      {users.isError && <FieldError>{adminErrorMessage(users.error)}</FieldError>}
      {users.data && users.data.users.length === 0 && (
        <p className="rounded-card border border-border-subtle bg-surface p-4 text-sm text-text-muted">
          没有符合条件的用户。
        </p>
      )}
      {users.data && users.data.users.length > 0 && (
        <div className="overflow-auto rounded-card border border-border-subtle bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border-subtle text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">用户</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">改密</th>
                <th className="px-4 py-3 font-medium">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {users.data.users.map((user) => (
                <tr key={user.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-3">
                    <Link
                      to="/admin/users/$userId"
                      params={{ userId: user.id }}
                      className="font-medium text-accent"
                    >
                      {user.nickname || user.username}
                    </Link>
                    <p className="text-xs text-text-muted">
                      @{user.username}
                      {user.email ? ` · ${user.email}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {user.status === 'deleted' ? '—' : user.mustChangePassword ? '必须修改' : '否'}
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatAdminTime(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {users.data && users.data.totalPages > 1 && (
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            disabled={search.page <= 1}
            onClick={() => updateSearch({ page: search.page - 1 })}
          >
            上一页
          </Button>
          <span className="text-sm text-text-muted">
            {users.data.page} / {users.data.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={search.page >= users.data.totalPages}
            onClick={() => updateSearch({ page: search.page + 1 })}
          >
            下一页
          </Button>
        </div>
      )}
    </section>
  );
}
