import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { usePostAuthLogin } from '@/api';
import type { postAuthLoginResponseSuccess } from '@/api';
import { getAccessToken, setAccessToken } from '@/lib/auth';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (getAccessToken()) throw redirect({ to: '/' });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { mutate: login, isPending } = usePostAuthLogin({
    mutation: {
      onSuccess: (res) => {
        setAccessToken((res as postAuthLoginResponseSuccess).data.accessToken);
        void navigate({ to: '/' });
      },
      onError: () => {
        setError('用户名或密码错误');
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    login({ data: { username, password } });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface-muted px-4">
      <div className="w-full max-w-sm rounded-card border border-border-subtle bg-surface px-8 py-10">
        <h1 className="mb-8 text-2xl font-bold text-text">登录故桌</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-control border border-border bg-app-bg px-4 py-2 text-sm text-text outline-none transition-colors focus:border-accent"
              placeholder="请输入用户名"
              autoComplete="username"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-control border border-border bg-app-bg px-4 py-2 text-sm text-text outline-none transition-colors focus:border-accent"
              placeholder="请输入密码"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-control bg-accent py-2 text-sm font-semibold text-accent-text transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? '登录中...' : '登录'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          没有账号？
          <Link to="/register" className="text-accent hover:underline">
            去注册
          </Link>
        </p>
      </div>
    </div>
  );
}
