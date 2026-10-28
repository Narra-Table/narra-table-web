import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useGetCapabilities, usePostAuthRegister, usePostAuthSendCode } from '@/api';
import type { postAuthRegisterResponseSuccess } from '@/api';
import { setAuthSession } from '@/lib/auth';
import { ApiError } from '@/lib/orvalClient';

const COOLDOWN = 60;

function errorCode(err: unknown): string {
  if (!(err instanceof ApiError) || typeof err.body !== 'object' || err.body === null) return '';
  if (!('code' in err.body) || typeof err.body.code !== 'string') return '';
  return err.body.code;
}

function registerErrorMessage(err: unknown, emailRequired: boolean): string {
  const code = errorCode(err);
  if (code === 'identity_conflict' || (err instanceof ApiError && err.status === 409)) {
    return emailRequired ? '用户名或邮箱已被占用' : '该用户名已被注册';
  }
  if (code === 'invalid_password') return '密码长度需要 8 到 72 位';
  if (code === 'invalid_username') return '用户名需为 3-32 位小写字母、数字、下划线或短横线';
  if (code === 'invalid_verification_code' || code === 'email_verification_required') {
    return '验证码不正确或已过期';
  }
  if (code === 'rate_limited' || (err instanceof ApiError && err.status === 429)) {
    return '尝试过于频繁，请稍后再试';
  }
  return '注册失败，请检查填写的信息';
}

export function RegisterForm() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const {
    data: capabilities,
    isPending: isCapabilitiesPending,
    isError: isCapabilitiesError,
  } = useGetCapabilities({
    query: { select: (response) => response.data },
  });
  const emailRequired = capabilities?.emailVerification === true;
  const registrationOpen = capabilities?.registration !== false;

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
        setAuthSession((res as postAuthRegisterResponseSuccess).data);
        void navigate({ to: '/' });
      },
      onError: (err: unknown) => {
        setError(registerErrorMessage(err, emailRequired));
      },
    },
  });

  function handleSendCode() {
    if (!email) {
      setError('请先输入邮箱');
      return;
    }
    setError('');
    sendCode({ data: { email, purpose: 'registration' } });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    register({
      data: emailRequired ? { username, email, password, code } : { username, password },
    });
  }

  if (isCapabilitiesPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-muted px-4">
        <p className="text-sm text-text-muted">正在读取注册设置...</p>
      </div>
    );
  }

  if (isCapabilitiesError || !capabilities) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-muted px-4">
        <p className="text-sm text-destructive">无法读取注册设置，请确认服务已启动</p>
      </div>
    );
  }

  if (!registrationOpen) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-muted px-4">
        <div className="w-full max-w-sm rounded-card border border-border-subtle bg-surface px-8 py-10 text-center">
          <h1 className="mb-3 text-2xl font-bold text-text">注册故桌</h1>
          <p className="text-sm text-text-muted">当前实例未开放注册</p>
          <Link to="/login" className="mt-6 inline-block text-sm text-accent hover:underline">
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface-muted px-4">
      <div className="w-full max-w-sm rounded-card border border-border-subtle bg-surface px-8 py-10">
        <h1 className="mb-8 text-2xl font-bold text-text">注册故桌</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-control border border-border bg-app-bg px-4 py-2 text-sm text-text outline-none transition-colors focus:border-accent"
              placeholder="3-32 位小写字母、数字、下划线或短横线"
              autoComplete="username"
              pattern="[a-z0-9_-]{3,32}"
              required
            />
          </div>
          {emailRequired && (
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
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-control border border-border bg-app-bg px-4 py-2 text-sm text-text outline-none transition-colors focus:border-accent"
              placeholder="至少 8 位"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
          </div>
          {emailRequired && (
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
          )}
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
