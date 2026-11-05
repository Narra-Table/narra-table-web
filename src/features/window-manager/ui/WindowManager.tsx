import { Component, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { cn } from '@/lib/classNames';
import { useMediaQuery } from '@/lib/useMediaQuery';
import type { WindowManagerStore } from '../model/store';
import {
  snapWindowWidth,
  WINDOW_WIDTHS,
  type WindowInstance,
  type WindowManagerState,
  type WindowWidth,
} from '../model/window-manager';
import { MobileWindowManager, WINDOW_HEADER_TONES } from './MobileWindowManager';

export interface WindowManagerProps {
  store: WindowManagerStore;
  toolbar?: ReactNode;
  renderWindow: (window: WindowInstance) => ReactNode;
  renderWindowHeaderAddon?: (window: WindowInstance) => ReactNode;
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

function widthClass(width: WindowWidth): string {
  if (width === 1) return 'w-full';
  if (width === 1 / 2) return 'w-1/2';
  return 'w-1/3';
}

function widthLabel(width: WindowWidth): string {
  if (width === 1) return '全宽';
  if (width === 1 / 2) return '二分之一';
  return '三分之一';
}

interface WindowResizeHandleProps {
  title: string;
  width: WindowWidth;
  getContainerWidth: () => number;
  onFocus: () => void;
  onResize: (width: WindowWidth) => void;
}

function WindowResizeHandle({
  title,
  width,
  getContainerWidth,
  onFocus,
  onResize,
}: WindowResizeHandleProps) {
  const snappedWidth = snapWindowWidth(width);
  const drag = useRef<{ pointerId: number; startX: number; startWidth: WindowWidth } | null>(null);

  const resizeByStep = (direction: -1 | 1) => {
    const currentIndex = WINDOW_WIDTHS.indexOf(snappedWidth);
    const nextIndex = Math.min(WINDOW_WIDTHS.length - 1, Math.max(0, currentIndex + direction));
    onResize(WINDOW_WIDTHS[nextIndex] ?? snappedWidth);
  };

  return (
    <div
      role="separator"
      aria-label={`调整${title}窗口宽度`}
      aria-orientation="vertical"
      aria-valuemin={33}
      aria-valuemax={100}
      aria-valuenow={Math.round(snappedWidth * 100)}
      aria-valuetext={widthLabel(snappedWidth)}
      tabIndex={0}
      className="group absolute inset-y-0 right-0 z-20 w-2 cursor-col-resize touch-none select-none outline-none"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        onFocus();
        drag.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startWidth: snappedWidth,
        };
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!drag.current || drag.current.pointerId !== event.pointerId) return;
        const containerWidth = getContainerWidth();
        if (containerWidth <= 0) return;
        onResize(
          snapWindowWidth(
            drag.current.startWidth + (event.clientX - drag.current.startX) / containerWidth,
          ),
        );
      }}
      onPointerUp={(event) => {
        if (drag.current?.pointerId !== event.pointerId) return;
        drag.current = null;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onLostPointerCapture={() => {
        drag.current = null;
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          onFocus();
          resizeByStep(-1);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          onFocus();
          resizeByStep(1);
        } else if (event.key === 'Home') {
          event.preventDefault();
          onFocus();
          onResize(WINDOW_WIDTHS[0]);
        } else if (event.key === 'End') {
          event.preventDefault();
          onFocus();
          onResize(WINDOW_WIDTHS[WINDOW_WIDTHS.length - 1]);
        }
      }}
    >
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border-subtle transition-colors group-hover:bg-accent group-focus-visible:bg-accent" />
    </div>
  );
}

export function useWindowManagerStore(store: WindowManagerStore): WindowManagerState {
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState(),
    () => store.getState(),
  );
}

export function WindowManager({
  store,
  toolbar,
  renderWindow,
  renderWindowHeaderAddon,
}: WindowManagerProps) {
  const state = useWindowManagerStore(store);
  const mobilePortrait = useMediaQuery('(max-width: 1023px) and (orientation: portrait)');
  const windowStripRef = useRef<HTMLDivElement>(null);

  const renderWindowContent = (window: WindowInstance) => (
    <WindowErrorBoundary title={window.title}>{renderWindow(window)}</WindowErrorBoundary>
  );

  if (mobilePortrait) {
    return (
      <MobileWindowManager
        state={state}
        toolbar={toolbar}
        renderWindow={renderWindowContent}
        renderWindowHeaderAddon={renderWindowHeaderAddon}
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

      <div
        ref={windowStripRef}
        className="scroll-subtle-native-hidden flex min-h-0 flex-1 gap-1 overflow-x-auto"
      >
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
                  'relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden bg-surface transition-[width] duration-150',
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
                  <h2 className="shrink-0 text-sm font-semibold">{window.title}</h2>
                  {renderWindowHeaderAddon?.(window)}
                  <span className="min-w-0 flex-1" />
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
                <WindowResizeHandle
                  title={window.title}
                  width={window.width}
                  getContainerWidth={() =>
                    windowStripRef.current?.getBoundingClientRect().width ?? 0
                  }
                  onFocus={() => store.actions.focus(window.instanceId)}
                  onResize={(width) => store.actions.resize(window.instanceId, width)}
                />
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
