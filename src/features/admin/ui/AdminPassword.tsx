import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldError, TextField } from '@/components/ui/field';
import { clearAdminSession, getAdminSession } from '@/lib/adminSession';
import { clearSessionQueries } from '@/lib/queryClient';
import { adminChangePassword } from '../api/adminClient';
import { adminErrorMessage } from '../model/copy';

export function AdminPassword() {
  const navigate = useNavigate();
  const forced = getAdminSession()?.forceChangePassword ?? false;
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      await adminChangePassword(oldPassword, newPassword);
      clearAdminSession();
      clearSessionQueries('admin');
      await navigate({ to: '/admin/login', search: { changed: true } });
    } catch (caught) {
      setError(adminErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-bold">修改密码</h1>
      <p className="text-sm text-text-muted">
        {forced
          ? '这是首次登录或重置后的密码。改完之后旧的管理会话会全部失效，需要重新登录。'
          : '修改成功后当前管理会话会失效，需要用新密码重新登录。'}
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-card border border-border-subtle bg-surface p-4"
      >
        <TextField
          label="当前密码"
          type="password"
          value={oldPassword}
          onChange={(event) => setOldPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        <TextField
          label="新密码"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
        />
        {error && <FieldError>{error}</FieldError>}
        <Button type="submit" disabled={pending}>
          {pending ? '提交中...' : '更新密码'}
        </Button>
      </form>
    </section>
  );
}
