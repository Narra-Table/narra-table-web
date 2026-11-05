import { Component, useSyncExternalStore, type ReactNode } from 'react';
import { cn } from '@/lib/classNames';
import { useMediaQuery } from '@/lib/useMediaQuery';
import type { WindowManagerStore } from '../model/store';
import type { WindowInstance, WindowManagerState } from '../model/window-manager';
import { MobileWindowManager, WINDOW_HEADER_TONES } from './MobileWindowManager';

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
  if (width >= 0.9) return 'w-full';
  if (width >= 0.6) return 'w-2/3';
  return 'w-1/2';
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
  const mobilePortrait = useMediaQuery('(max-width: 1023px) and (orientation: portrait)');

  const renderWindowContent = (window: WindowInstance) => (
    <WindowErrorBoundary title={window.title}>{renderWindow(window)}</WindowErrorBoundary>
  );

  if (mobilePortrait) {
    return (
      <MobileWindowManager
        state={state}
        toolbar={toolbar}
        renderWindow={renderWindowContent}
        onFocus={(instanceId) => store.actions.focus(instanceId)}
        onClose={(instanceId) => store.actions.close(instanceId)}
      />
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-app-bg text-text">
      {toolbar ? (
        <header className="flex min-h-12 shrink-0 items-center border-b border-border-subtle bg-surface px-3">
          {toolbar}
        </header>
      ) : null}

      <div className="scroll-subtle-native-hidden flex min-h-0 flex-1 gap-1 overflow-x-auto">
        {state.windows.length === 0 ? (
          <div className="grid min-h-48 flex-1 place-items-center bg-surface p-4 text-sm text-text-muted">
            工作台是空的，请从顶部打开一个窗口。
          </div>
        ) : (
          state.windows.map((window, index) => {
            const focused = window.instanceId === state.focusedWindowId;
            return (
              <article
                key={window.instanceId}
                className={cn(
                  'flex h-full min-h-0 shrink-0 flex-col overflow-hidden bg-surface',
                  widthClass(window.width),
                )}
                onPointerDown={() => store.actions.focus(window.instanceId)}
                onFocusCapture={() => store.actions.focus(window.instanceId)}
              >
                <header
                  className={cn(
                    'flex h-10 shrink-0 items-center gap-2 px-3 transition-opacity',
                    WINDOW_HEADER_TONES[index % WINDOW_HEADER_TONES.length],
                    focused ? 'opacity-100' : 'opacity-75',
                  )}
                >
                  <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{window.title}</h2>
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-control text-lg text-current hover:bg-surface-muted"
                    aria-label={`关闭${window.title}`}
                    onClick={() => store.actions.close(window.instanceId)}
                  >
                    ×
                  </button>
                </header>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {renderWindowContent(window)}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
