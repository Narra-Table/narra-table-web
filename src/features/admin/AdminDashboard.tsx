import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { adminDashboardQuery, defaultUserSearch } from '@/lib/adminQueries';
import { adminErrorMessage } from './copy';
import { ErrorText } from './ui';

export function AdminDashboard() {
  const dashboard = useQuery(adminDashboardQuery);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">概览</h1>
        <p className="mt-2 text-sm text-text-muted">查看账号规模，再进入用户恢复或插件目录。</p>
      </div>
      {dashboard.isPending && <p className="text-sm text-text-muted">正在读取概览...</p>}
      {dashboard.isError && <ErrorText>{adminErrorMessage(dashboard.error)}</ErrorText>}
      {dashboard.data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-card border border-border-subtle bg-surface p-4">
            <p className="text-sm text-text-muted">用户</p>
            <p className="mt-2 text-3xl font-bold">{dashboard.data.userCount}</p>
          </article>
          <article className="rounded-card border border-border-subtle bg-surface p-4">
            <p className="text-sm text-text-muted">管理员</p>
            <p className="mt-2 text-3xl font-bold">{dashboard.data.adminCount}</p>
          </article>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin/users"
          search={defaultUserSearch}
          className="rounded-control bg-accent px-5 py-2.5 text-sm font-semibold text-accent-text"
        >
          管理用户
        </Link>
        <Link
          to="/admin/plugins"
          className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-text"
        >
          管理插件
        </Link>
        <Link
          to="/admin/password"
          className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-text"
        >
          修改密码
        </Link>
      </div>
    </section>
  );
}
