import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { usePostAuthRegister, usePostAuthSendCode } from '@/api';
import type { postAuthRegisterResponseSuccess } from '@/api';
import { getAccessToken, setAccessToken } from '@/lib/auth';

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    if (getAccessToken()) throw redirect({ to: '/' });
  },
  component: RegisterPage,
});

const COOLDOWN = 60;

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const { mutate: sendCode, isPending: isSending } = usePostAuthSendCode({
    mutation: {
      onSuccess: () => {
        setCountdown(COOLDOWN);
        timerRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              clearInterval(timerRef.current!);
              timerRef.current = null;
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      },
      onError: () => {
        setError('发送验证码失败，请稍后重试');
      },
    },
  });

  const { mutate: register, isPending } = usePostAuthRegister({
    mutation: {
      onSuccess: (res) => {
        setAccessToken((res as postAuthRegisterResponseSuccess).data.accessToken);
        void navigate({ to: '/' });
      },
      onError: (err: { status?: number }) => {
        if (err?.status === 409) {
          setError('该邮箱已被注册');
        } else {
          setError('注册失败，请检查填写的信息');
        }
      },
    },
  });

  function handleSendCode() {
    if (!email) {
      setError('请先输入邮箱');
      return;
    }
    setError('');
    sendCode({ data: { email } });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    register({ data: { email, password, code } });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface-muted px-4">
      <div className="w-full max-w-sm rounded-card border border-border-subtle bg-surface px-8 py-10">
        <h1 className="mb-8 text-2xl font-bold text-text">注册故桌</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-control border border-border bg-app-bg px-4 py-2 text-sm text-text outline-none transition-colors focus:border-accent"
              placeholder="请输入邮箱"
              autoComplete="email"
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
              autoComplete="new-password"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text">验证码</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-w-0 flex-1 rounded-control border border-border bg-surface px-4 py-2 text-sm text-text outline-none transition-colors focus:border-accent"
                placeholder="请输入邮箱验证码"
                required
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSending || countdown > 0}
                className="shrink-0 rounded-control border border-border bg-app-bg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-muted disabled:opacity-50"
              >
                {countdown > 0 ? `${countdown}s` : isSending ? '发送中' : '发送验证码'}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-control bg-accent py-2 text-sm font-semibold text-accent-text transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? '注册中...' : '注册'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          已有账号？
          <Link to="/login" className="text-accent hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
