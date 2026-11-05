import { Component, useSyncExternalStore, type ReactNode } from 'react';
import { cn } from '@/lib/classNames';
import type { WindowManagerStore } from '../model/store';
import type { WindowInstance, WindowManagerState } from '../model/window-manager';

export interface WindowManagerProps {
  store: WindowManagerStore;
  toolbar?: ReactNode;
  renderWindow: (window: WindowInstance) => ReactNode;
}

class WindowErrorBoundary extends Component<
  { children: ReactNode; title: string },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? (
      <div className="grid min-h-0 flex-1 place-items-center p-4 text-sm text-danger">
        {this.props.title}加载失败
      </div>
    ) : (
      this.props.children
    );
  }
}

function widthClass(width: number): string {
  if (width >= 0.9) return 'lg:w-full';
  if (width >= 0.6) return 'lg:w-2/3';
  return 'lg:w-1/2';
}

export function useWindowManagerStore(store: WindowManagerStore): WindowManagerState {
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState(),
    () => store.getState(),
  );
}

export function WindowManager({ store, toolbar, renderWindow }: WindowManagerProps) {
  const state = useWindowManagerStore(store);

  return (
    <section className="flex h-full min-h-0 flex-col bg-app-bg text-text">
      {toolbar ? (
        <header className="flex min-h-12 shrink-0 items-center border-b border-border-subtle bg-surface px-3">
          {toolbar}
        </header>
      ) : null}

      <div className="scroll-subtle-native-hidden flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-2 lg:flex-row lg:overflow-x-auto lg:overflow-y-hidden">
        {state.windows.length === 0 ? (
          <div className="grid min-h-48 flex-1 place-items-center border border-border-subtle bg-surface p-4 text-sm text-text-muted">
            工作台是空的，请从顶部打开一个窗口。
          </div>
        ) : (
          state.windows.map((window) => {
            const focused = window.instanceId === state.focusedWindowId;
            return (
              <article
                key={window.instanceId}
                className={cn(
                  'flex min-h-80 w-full shrink-0 flex-col overflow-hidden border bg-surface lg:h-full lg:min-h-0',
                  widthClass(window.width),
                  focused ? 'border-accent' : 'border-border-subtle',
                )}
                onPointerDown={() => store.actions.focus(window.instanceId)}
                onFocusCapture={() => store.actions.focus(window.instanceId)}
              >
                <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border-subtle px-3">
                  <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-text">
                    {window.title}
                  </h2>
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-control text-lg text-text-muted hover:bg-surface-muted hover:text-text"
                    aria-label={`关闭${window.title}`}
                    onClick={() => store.actions.close(window.instanceId)}
                  >
                    ×
                  </button>
                </header>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <WindowErrorBoundary title={window.title}>
                    {renderWindow(window)}
                  </WindowErrorBoundary>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
