import { createRootRoute, Outlet } from '@tanstack/react-router';

const RootLayout = () => (
  <div className="min-h-screen bg-app-bg text-text">
    <Outlet />
    <div id="modal-root" />
    <div id="toast-root" />
  </div>
);

const RootPending = () => (
  <div className="grid min-h-screen place-items-center bg-app-bg text-sm text-text-muted">
    页面加载中...
  </div>
);

const RootError = () => (
  <div className="grid min-h-screen place-items-center bg-app-bg p-6 text-text">
    <section className="rounded-lg border-2 border-black p-5">
      <h1 className="text-xl font-semibold">页面出错</h1>
      <p className="mt-2 text-sm text-text-muted">全局错误边界占位。</p>
    </section>
  </div>
);

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RootError,
  pendingComponent: RootPending,
});
