import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { buttonClassName } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field';
import { adminDashboardQuery, defaultUserSearch } from '../api/adminQueries';
import { adminErrorMessage } from '../model/copy';

export function AdminDashboard() {
  const dashboard = useQuery(adminDashboardQuery);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">概览</h1>
        <p className="mt-2 text-sm text-text-muted">查看账号规模，再进入用户恢复或插件目录。</p>
      </div>
      {dashboard.isPending && <p className="text-sm text-text-muted">正在读取概览...</p>}
      {dashboard.isError && <FieldError>{adminErrorMessage(dashboard.error)}</FieldError>}
      {dashboard.data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-sm text-text-muted">用户</p>
            <p className="mt-2 text-3xl font-bold">{dashboard.data.userCount}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-muted">管理员</p>
            <p className="mt-2 text-3xl font-bold">{dashboard.data.adminCount}</p>
          </Card>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin/users"
          search={defaultUserSearch}
          className={buttonClassName({ className: 'px-5 py-2.5' })}
        >
          管理用户
        </Link>
        <Link to="/admin/plugins" className={buttonClassName({ variant: 'secondary' })}>
          管理插件
        </Link>
        <Link to="/admin/password" className={buttonClassName({ variant: 'secondary' })}>
          修改密码
        </Link>
      </div>
    </section>
  );
}
