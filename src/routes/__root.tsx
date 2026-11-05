import { createRootRoute, Outlet } from '@tanstack/react-router';
import { PersistentToolbar, PersistentToolbarProvider } from '@/views/layouts/PersistentToolbar';

const RootLayout = () => (
  <PersistentToolbarProvider>
    <div className="h-dvh overflow-hidden bg-app-bg text-text">
      <div className="h-full min-h-0 overflow-hidden">
        <Outlet />
      </div>
      <div id="toolbar-root" />
      <div id="modal-root" />
      <div id="toast-root" />
      <PersistentToolbar />
    </div>
  </PersistentToolbarProvider>
);

const RootPending = () => (
  <div className="grid min-h-screen place-items-center bg-app-bg text-sm text-text-muted">
    页面加载中...
  </div>
);

const RootError = () => (
  <div className="grid min-h-screen place-items-center bg-app-bg p-6 text-text">
    <section className="border border-border p-5">
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
