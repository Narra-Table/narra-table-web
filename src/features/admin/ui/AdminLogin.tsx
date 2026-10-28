import { useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { setAdminSession } from '@/lib/adminSession';
import { adminLogin } from '../api/adminClient';
import { adminErrorMessage } from '../model/copy';
import { ErrorText, PrimaryButton, TextField } from './primitives';

export function AdminLogin() {
  const navigate = useNavigate();
  const { changed } = useSearch({ from: '/admin_/login' });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      const result = await adminLogin(username.trim(), password);
      setAdminSession(result.accessToken, result.forceChangePassword);
      await navigate({ to: result.forceChangePassword ? '/admin/password' : '/admin' });
    } catch (caught) {
      setError(adminErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface-muted px-4">
      <div className="w-full max-w-sm rounded-card border border-border-subtle bg-surface px-8 py-10">
        <h1 className="text-2xl font-bold text-text">管理登录</h1>
        <p className="mt-2 text-sm text-text-muted">这里只进入操作员会话，和玩家登录互不影响。</p>
        {changed && (
          <p className="mt-4 rounded-control bg-success/15 px-4 py-2 text-sm text-success">
            密码已更新，请用新密码重新登录。
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <TextField
            label="用户名"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
          <TextField
            label="密码"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <ErrorText>{error}</ErrorText>}
          <PrimaryButton type="submit" disabled={pending} className="mt-2">
            {pending ? '登录中...' : '登录'}
          </PrimaryButton>
        </form>
        {import.meta.env.VITE_MOCK === 'true' && (
          <p className="mt-6 text-sm text-text-muted">
            开发 mock 的初始账号是 admin / admin。第一次登录会要求修改密码。
          </p>
        )}
      </div>
    </div>
  );
}
