import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FieldError, TextField } from '@/components/ui/field';
import {
  anonymizeAdminUser,
  disableAdminUser,
  issueTemporaryPassword,
  restoreAdminUser,
} from '../api/adminClient';
import {
  adminDashboardQuery,
  adminUserListsQuery,
  adminUserQuery,
  defaultUserSearch,
} from '../api/adminQueries';
import { adminErrorMessage, availableUserActions } from '../model/copy';
import { formatAdminTime } from '../model/formatAdminTime';
import { AdminStatusBadge } from './AdminStatusBadge';

export function AdminUserDetail() {
  const { userId } = useParams({ from: '/admin/users/$userId' });
  const queryClient = useQueryClient();
  const user = useQuery(adminUserQuery(userId));
  const [confirm, setConfirm] = useState<'disable' | 'restore' | 'anonymize' | null>(null);
  const [typedName, setTypedName] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [error, setError] = useState('');

  function refresh(nextId = userId) {
    void queryClient.invalidateQueries({ queryKey: adminUserQuery(nextId).queryKey });
    void queryClient.invalidateQueries({ queryKey: adminUserListsQuery.queryKey });
    void queryClient.invalidateQueries({ queryKey: adminDashboardQuery.queryKey });
  }

  const disable = useMutation({
    mutationFn: () => disableAdminUser(userId),
    onSuccess: () => {
      setConfirm(null);
      setError('');
      refresh();
    },
    onError: (caught) => setError(adminErrorMessage(caught)),
  });
  const restore = useMutation({
    mutationFn: () => restoreAdminUser(userId),
    onSuccess: () => {
      setConfirm(null);
      setError('');
      refresh();
    },
    onError: (caught) => setError(adminErrorMessage(caught)),
  });
  const resetPassword = useMutation({
    mutationFn: () => issueTemporaryPassword(userId),
    onSuccess: (result) => {
      setError('');
      setTemporaryPassword(result.temporaryPassword);
      refresh();
    },
    onError: (caught) => setError(adminErrorMessage(caught)),
  });
  const anonymize = useMutation({
    mutationFn: () => anonymizeAdminUser(userId),
    onSuccess: () => {
      setConfirm(null);
      setTypedName('');
      setError('');
      refresh();
    },
    onError: (caught) => setError(adminErrorMessage(caught)),
  });

  const pending =
    disable.isPending || restore.isPending || resetPassword.isPending || anonymize.isPending;
  const actions = user.data ? availableUserActions(user.data.status) : [];

  return (
    <section className="flex flex-col gap-6">
      <Link to="/admin/users" search={defaultUserSearch} className="text-sm text-accent">
        返回用户列表
      </Link>
      {user.isPending && <p className="text-sm text-text-muted">正在读取用户...</p>}
      {user.isError && <FieldError>{adminErrorMessage(user.error)}</FieldError>}
      {user.data && (
        <div className="flex flex-col gap-4 rounded-card border border-border-subtle bg-surface p-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{user.data.nickname || user.data.username}</h1>
            <AdminStatusBadge status={user.data.status} />
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="用户名" value={`@${user.data.username}`} />
            <Info label="邮箱" value={user.data.email || '未绑定'} />
            <Info label="必须改密" value={user.data.mustChangePassword ? '是' : '否'} />
            <Info label="创建时间" value={formatAdminTime(user.data.createdAt)} />
            <Info label="更新时间" value={formatAdminTime(user.data.updatedAt)} />
            <Info label="用户 ID" value={user.data.id} />
          </dl>
          {user.data.status === 'deleted' && (
            <p className="text-sm text-text-muted">
              这个账号已经匿名化。历史内容仍保留原作者
              ID，但身份、凭证和成员关系已经清除，不能再登录。
            </p>
          )}
          {error && <FieldError>{error}</FieldError>}
          <div className="flex flex-wrap gap-3">
            {actions.includes('disable') && (
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() => setConfirm('disable')}
              >
                禁用
              </Button>
            )}
            {actions.includes('restore') && (
              <Button disabled={pending} onClick={() => setConfirm('restore')}>
                恢复
              </Button>
            )}
            {actions.includes('temporaryPassword') && (
              <Button variant="secondary" disabled={pending} onClick={() => resetPassword.mutate()}>
                发放临时密码
              </Button>
            )}
            {actions.includes('anonymize') && (
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() => setConfirm('anonymize')}
              >
                匿名化
              </Button>
            )}
          </div>
        </div>
      )}
      {confirm === 'disable' && user.data && (
        <Dialog title="禁用账号" onClose={() => setConfirm(null)}>
          <p className="text-sm text-text-muted">
            禁用 @{user.data.username}{' '}
            会立刻撤销会话并断开连接。恢复后可以重新登录，旧会话不会回来。
          </p>
          <div className="mt-4 flex gap-3">
            <Button variant="destructive" disabled={pending} onClick={() => disable.mutate()}>
              确认禁用
            </Button>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              取消
            </Button>
          </div>
        </Dialog>
      )}
      {confirm === 'restore' && user.data && (
        <Dialog title="恢复账号" onClose={() => setConfirm(null)}>
          <p className="text-sm text-text-muted">
            恢复 @{user.data.username}{' '}
            只重新开放登录。被撤销的会话、被移出的关系和面具权限都不会自动回来。
          </p>
          <div className="mt-4 flex gap-3">
            <Button disabled={pending} onClick={() => restore.mutate()}>
              确认恢复
            </Button>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              取消
            </Button>
          </div>
        </Dialog>
      )}
      {confirm === 'anonymize' && user.data && (
        <Dialog
          title="匿名化账号"
          onClose={() => {
            setConfirm(null);
            setTypedName('');
          }}
        >
          <p className="text-sm text-text-muted">
            这会清除 @{user.data.username}{' '}
            的凭证和个人身份，并移除好友、成员和面具权限。已经写出的内容仍挂在原来的作者 ID
            上，显示为匿名身份。此操作不能撤销。
          </p>
          <div className="mt-4">
            <TextField
              label={`输入 ${user.data.username} 以确认`}
              value={typedName}
              onChange={(event) => setTypedName(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <Button
              variant="destructive"
              disabled={pending || typedName !== user.data.username}
              onClick={() => anonymize.mutate()}
            >
              确认匿名化
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirm(null);
                setTypedName('');
              }}
            >
              取消
            </Button>
          </div>
        </Dialog>
      )}
      {temporaryPassword && (
        <Dialog title="临时密码" onClose={() => setTemporaryPassword(null)}>
          <p className="text-sm text-text-muted">
            这个密码只显示这一次。关掉之后无法再查看。用户用它登录后必须先修改密码，旧会话已经失效。
          </p>
          <p className="mt-4 rounded-control bg-surface-muted px-4 py-3 font-medium break-all">
            {temporaryPassword}
          </p>
          <div className="mt-4 flex gap-3">
            <Button
              onClick={() => {
                void navigator.clipboard.writeText(temporaryPassword);
              }}
            >
              复制
            </Button>
            <Button variant="secondary" onClick={() => setTemporaryPassword(null)}>
              我已记下
            </Button>
          </div>
        </Dialog>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-text-muted">{label}</dt>
      <dd className="mt-1 break-all font-medium">{value}</dd>
    </div>
  );
}
