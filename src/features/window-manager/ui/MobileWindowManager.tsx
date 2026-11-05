import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/classNames';
import type { WindowInstance, WindowManagerState } from '../model/window-manager';

export interface MobileWindowManagerProps {
  state: WindowManagerState;
  toolbar?: ReactNode;
  renderWindow: (window: WindowInstance) => ReactNode;
  onFocus: (instanceId: string) => void;
  onClose: (instanceId: string) => void;
}

export function MobileWindowManager({
  state,
  toolbar,
  renderWindow,
  onFocus,
  onClose,
}: MobileWindowManagerProps) {
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [state.focusedWindowId]);

  return (
    <section className="flex h-full min-h-0 flex-col bg-app-bg text-text">
      {toolbar ? (
        <header className="flex min-h-12 shrink-0 items-center border-b border-border-subtle bg-surface px-3">
          {toolbar}
        </header>
      ) : null}

      {state.windows.length > 0 ? (
        <div
          role="tablist"
          aria-label="窗口"
          className="scroll-subtle-native-hidden flex shrink-0 overflow-x-auto border-b border-border-subtle bg-surface"
        >
          {state.windows.map((window) => {
            const focused = window.instanceId === state.focusedWindowId;
            return (
              <button
                key={window.instanceId}
                ref={focused ? activeTabRef : undefined}
                type="button"
                role="tab"
                aria-selected={focused}
                className={cn(
                  'shrink-0 border-r border-border-subtle px-3 py-2 text-sm',
                  focused
                    ? 'bg-surface-muted font-semibold text-text'
                    : 'text-text-muted hover:bg-surface-muted hover:text-text',
                )}
                onClick={() => onFocus(window.instanceId)}
              >
                {window.title}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden p-2">
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
                  'min-h-0 w-full flex-col overflow-hidden border bg-surface',
                  focused ? 'flex border-accent' : 'hidden border-border-subtle',
                )}
              >
                <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border-subtle px-3">
                  <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-text">
                    {window.title}
                  </h2>
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-control text-lg text-text-muted hover:bg-surface-muted hover:text-text"
                    aria-label={`关闭${window.title}`}
                    onClick={() => onClose(window.instanceId)}
                  >
                    ×
                  </button>
                </header>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {renderWindow(window)}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
