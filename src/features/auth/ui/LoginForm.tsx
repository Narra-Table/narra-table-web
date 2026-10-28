import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { usePostAuthLogin } from '@/api';
import type { postAuthLoginResponseSuccess } from '@/api';
import { Button } from '@/components/ui/button';
import { FieldError, TextField } from '@/components/ui/field';
import { setAuthSession } from '@/lib/authSession';

export function LoginForm() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { mutate: login, isPending } = usePostAuthLogin({
    mutation: {
      onSuccess: (res) => {
        setAuthSession((res as postAuthLoginResponseSuccess).data);
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
          <TextField
            label="用户名"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            autoComplete="username"
            required
          />
          <TextField
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            autoComplete="current-password"
            required
          />
          {error && <FieldError>{error}</FieldError>}
          <Button type="submit" disabled={isPending} className="mt-2">
            {isPending ? '登录中...' : '登录'}
          </Button>
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
