import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/classNames';
import type { WindowInstance, WindowManagerState } from '../model/window-manager';

const WINDOW_HEADER_TONES: Readonly<Record<string, string>> = {
  chat: 'bg-accent/15 text-accent',
  characters: 'bg-info/15 text-info',
  members: 'bg-success/15 text-success',
  clues: 'bg-warning/15 text-warning',
  combat: 'bg-danger/15 text-danger',
  map: 'bg-surface-muted text-text',
};

export function resolveWindowHeaderTone(windowTypeId: string): string {
  return WINDOW_HEADER_TONES[windowTypeId] ?? 'bg-surface-muted text-text';
}

export interface MobileWindowManagerProps {
  state: WindowManagerState;
  toolbar?: ReactNode;
  renderWindow: (window: WindowInstance) => ReactNode;
  renderWindowHeaderAddon?: (window: WindowInstance) => ReactNode;
  onFocus: (instanceId: string) => void;
  onClose: (instanceId: string) => void;
}

export function MobileWindowManager({
  state,
  toolbar,
  renderWindow,
  renderWindowHeaderAddon,
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
          className="scroll-subtle-native-hidden flex shrink-0 gap-1 overflow-x-auto bg-app-bg"
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
                  'shrink-0 px-3 py-2 text-sm',
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

      <div className="flex min-h-0 flex-1 overflow-hidden">
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
                  'min-h-0 w-full flex-col overflow-hidden bg-surface',
                  focused ? 'flex' : 'hidden',
                )}
              >
                <header
                  className={cn(
                    'flex h-10 shrink-0 items-center gap-2 px-3',
                    resolveWindowHeaderTone(window.windowTypeId),
                  )}
                >
                  <h2 className="shrink-0 text-sm font-semibold">{window.title}</h2>
                  {renderWindowHeaderAddon?.(window)}
                  <span className="min-w-0 flex-1" />
                  <button
                    type="button"
                    className="grid size-8 place-items-center rounded-control text-lg text-current hover:bg-surface-muted"
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
