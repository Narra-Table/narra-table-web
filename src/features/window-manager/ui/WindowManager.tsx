import {
  Component,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/classNames';
import { matchesMediaQuery, useMediaQuery } from '@/lib/responsive';
import type { WindowManagerStore } from '../model/store';
import {
  snapWindowWidth,
  WINDOW_WIDTHS,
  type WindowInstance,
  type WindowManagerState,
  type WindowWidth,
} from '../model/window-manager';
import { useEdgeAutoScroll } from './useEdgeAutoScroll';

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

export interface WindowManagerProps {
  edgeAutoScroll?: boolean;
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
  if (width === 2 / 3) return 'w-2/3';
  if (width === 1 / 2) return 'w-1/2';
  return 'w-1/3';
}

function widthLabel(width: WindowWidth): string {
  if (width === 1) return '全宽';
  if (width === 2 / 3) return '三分之二';
  if (width === 1 / 2) return '二分之一';
  return '三分之一';
}

function clampPreviewWidth(width: number): number {
  return Math.min(1, Math.max(1 / 3, width));
}

interface WindowResizeHandleProps {
  title: string;
  width: WindowWidth;
  getContainer: () => HTMLDivElement | null;
  getTrailingSpace: () => HTMLDivElement | null;
  onFocus: () => void;
  onResize: (width: WindowWidth) => void;
}

const AUTO_SCROLL_EDGE_SIZE = 48;
const AUTO_SCROLL_MAX_SPEED = 20;

function WindowResizeHandle({
  title,
  width,
  getContainer,
  getTrailingSpace,
  onFocus,
  onResize,
}: WindowResizeHandleProps) {
  const snappedWidth = snapWindowWidth(width);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startWidth: WindowWidth;
    previewWidth: number;
    pointerX: number;
    startScrollLeft: number;
    animationFrame: number | null;
    windowElement: HTMLElement;
    container: HTMLDivElement;
    trailingSpace: HTMLDivElement;
  } | null>(null);

  const applyPreviewWidth = (previewWidth: number, containerWidth: number) => {
    if (!drag.current) return;
    const { startWidth, trailingSpace, windowElement } = drag.current;
    if (previewWidth < startWidth) {
      trailingSpace.classList.remove('hidden');
      trailingSpace.style.width = `${(startWidth - previewWidth) * containerWidth}px`;
    } else {
      trailingSpace.style.width = '0px';
      trailingSpace.classList.add('hidden');
    }
    drag.current.previewWidth = previewWidth;
    windowElement.style.width = `${previewWidth * 100}%`;
  };

  const updatePreview = () => {
    if (!drag.current) return;
    const { container, pointerX, startScrollLeft, startWidth, startX } = drag.current;
    const containerWidth = container.getBoundingClientRect().width;
    if (containerWidth <= 0) return;
    const previewWidth = clampPreviewWidth(
      startWidth + (pointerX - startX + container.scrollLeft - startScrollLeft) / containerWidth,
    );
    applyPreviewWidth(previewWidth, containerWidth);
  };

  const continueAutoScroll = () => {
    if (!drag.current) return;
    const { container, pointerX, previewWidth } = drag.current;
    const bounds = container.getBoundingClientRect();
    const distanceFromLeft = pointerX - bounds.left;
    const distanceFromRight = bounds.right - pointerX;
    const direction =
      distanceFromRight < AUTO_SCROLL_EDGE_SIZE && previewWidth < 1
        ? 1
        : distanceFromLeft < AUTO_SCROLL_EDGE_SIZE && previewWidth > 1 / 3
          ? -1
          : 0;

    if (direction === 0) {
      drag.current.animationFrame = null;
      return;
    }

    const edgeDistance = direction > 0 ? distanceFromRight : distanceFromLeft;
    const speed =
      direction *
      AUTO_SCROLL_MAX_SPEED *
      Math.min(1, Math.max(0, (AUTO_SCROLL_EDGE_SIZE - edgeDistance) / AUTO_SCROLL_EDGE_SIZE));

    if (direction > 0) {
      const containerWidth = container.getBoundingClientRect().width;
      if (containerWidth <= 0) {
        drag.current.animationFrame = null;
        return;
      }
      const nextPreviewWidth = clampPreviewWidth(previewWidth + speed / containerWidth);
      const addedWidth = (nextPreviewWidth - previewWidth) * containerWidth;
      if (addedWidth <= 0) {
        drag.current.animationFrame = null;
        return;
      }
      applyPreviewWidth(nextPreviewWidth, containerWidth);
      container.scrollLeft += addedWidth;
      drag.current.animationFrame = requestAnimationFrame(continueAutoScroll);
      return;
    }

    const previousScrollLeft = container.scrollLeft;
    container.scrollLeft += speed;
    if (container.scrollLeft === previousScrollLeft) {
      drag.current.animationFrame = null;
      return;
    }
    updatePreview();
    drag.current.animationFrame = requestAnimationFrame(continueAutoScroll);
  };

  const startAutoScroll = () => {
    if (!drag.current || drag.current.animationFrame !== null) return;
    drag.current.animationFrame = requestAnimationFrame(continueAutoScroll);
  };

  const finishDrag = (pointerId: number) => {
    if (!drag.current || drag.current.pointerId !== pointerId) return;
    const { animationFrame, previewWidth, trailingSpace, windowElement } = drag.current;
    const finalWidth = snapWindowWidth(previewWidth);
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    drag.current = null;
    setDragging(false);
    windowElement.classList.remove('transition-none');
    void windowElement.offsetWidth;
    windowElement.style.width = `${finalWidth * 100}%`;
    onResize(finalWidth);

    const clearPreview = () => {
      windowElement.style.removeProperty('width');
      trailingSpace.style.width = '0px';
      trailingSpace.classList.add('hidden');
    };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(clearPreview);
    } else {
      setTimeout(clearPreview, 0);
    }
  };

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
        const windowElement = event.currentTarget.parentElement;
        const container = getContainer();
        const trailingSpace = getTrailingSpace();
        if (!windowElement || !container || !trailingSpace) return;
        event.preventDefault();
        onFocus();
        trailingSpace.style.width = '0px';
        trailingSpace.classList.add('hidden');
        windowElement.classList.add('transition-none');
        setDragging(true);
        drag.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startWidth: snappedWidth,
          previewWidth: snappedWidth,
          pointerX: event.clientX,
          startScrollLeft: container.scrollLeft,
          animationFrame: null,
          windowElement,
          container,
          trailingSpace,
        };
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!drag.current || drag.current.pointerId !== event.pointerId) return;
        drag.current.pointerX = event.clientX;
        updatePreview();
        startAutoScroll();
      }}
      onPointerUp={(event) => {
        if (drag.current?.pointerId !== event.pointerId) return;
        finishDrag(event.pointerId);
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      }}
      onPointerCancel={(event) => {
        finishDrag(event.pointerId);
      }}
      onLostPointerCapture={(event) => {
        finishDrag(event.pointerId);
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
      <span
        className={cn(
          'absolute inset-y-0 right-0 w-1 bg-info transition-opacity duration-150',
          dragging
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
        )}
      />
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
  edgeAutoScroll = false,
  store,
  toolbar,
  renderWindow,
  renderWindowHeaderAddon,
}: WindowManagerProps) {
  const state = useWindowManagerStore(store);
  const compactPortrait = useMediaQuery('compactPortrait');
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const windowStripRef = useRef<HTMLDivElement>(null);
  const windowElementsRef = useRef(new Map<string, HTMLDivElement>());
  const previousFocusedWindowRef = useRef(state.focusedWindowId);
  const previousWindowsRef = useRef(state.windows);
  const trailingSpaceRef = useRef<HTMLDivElement>(null);
  const edgeAutoScrollDirection = useEdgeAutoScroll(
    windowStripRef,
    edgeAutoScroll && !compactPortrait,
  );

  useLayoutEffect(() => {
    const strip = windowStripRef.current;
    if (!strip || compactPortrait || Math.abs(strip.scrollLeft - state.scrollLeft) < 1) return;
    strip.scrollLeft = state.scrollLeft;
  }, [compactPortrait, state.scrollLeft]);

  useEffect(() => {
    const focusChanged = previousFocusedWindowRef.current !== state.focusedWindowId;
    const windowsChanged = previousWindowsRef.current !== state.windows;
    previousFocusedWindowRef.current = state.focusedWindowId;
    previousWindowsRef.current = state.windows;
    if ((!focusChanged && !windowsChanged) || compactPortrait) return;

    const strip = windowStripRef.current;
    const focusedWindow = state.focusedWindowId
      ? windowElementsRef.current.get(state.focusedWindowId)
      : undefined;
    if (!strip || !focusedWindow) return;

    const stripBox = strip.getBoundingClientRect();
    const windowBox = focusedWindow.getBoundingClientRect();
    let nextScrollLeft = strip.scrollLeft;

    if (windowBox.width >= stripBox.width || windowBox.left < stripBox.left) {
      nextScrollLeft += windowBox.left - stripBox.left;
    } else if (windowBox.right > stripBox.right) {
      nextScrollLeft += windowBox.right - stripBox.right;
    }

    if (Math.abs(nextScrollLeft - strip.scrollLeft) < 1) return;
    const behavior = matchesMediaQuery('reducedMotion') ? 'auto' : 'smooth';
    if (typeof strip.scrollTo === 'function') {
      strip.scrollTo({ left: nextScrollLeft, behavior });
    } else {
      strip.scrollLeft = nextScrollLeft;
    }
  }, [compactPortrait, state.focusedWindowId, state.windows]);

  useEffect(() => {
    if (compactPortrait) {
      activeTabRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }
  }, [compactPortrait, state.focusedWindowId]);

  const renderWindowContent = (window: WindowInstance) => (
    <WindowErrorBoundary title={window.title}>{renderWindow(window)}</WindowErrorBoundary>
  );

  return (
    <section className="flex h-full min-h-0 flex-col bg-app-bg text-text">
      {toolbar ? (
        <header className="flex min-h-12 shrink-0 items-center border-b border-border-subtle bg-surface px-3">
          {toolbar}
        </header>
      ) : null}

      {compactPortrait && state.windows.length > 0 ? (
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
                onClick={() => store.actions.focus(window.instanceId)}
              >
                {window.title}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <div
          ref={windowStripRef}
          className={cn(
            'flex h-full min-h-0',
            compactPortrait ? 'overflow-hidden' : 'scroll-subtle-native-hidden overflow-x-auto',
          )}
          onScroll={(event) => store.actions.setScrollLeft(event.currentTarget.scrollLeft)}
        >
          {state.windows.length === 0 ? (
            <div
              className={cn(
                'grid min-h-48 flex-1 place-items-center bg-surface p-4 text-sm text-text-muted',
                compactPortrait && 'border border-border-subtle',
              )}
            >
              工作台是空的，请从顶部打开一个窗口。
            </div>
          ) : (
            state.windows.map((window) => {
              const focused = window.instanceId === state.focusedWindowId;
              return (
                <div
                  key={window.instanceId}
                  ref={(element) => {
                    if (element) windowElementsRef.current.set(window.instanceId, element);
                    else windowElementsRef.current.delete(window.instanceId);
                  }}
                  className={cn(
                    'relative h-full min-h-0 shrink-0 transition-[width] duration-150',
                    compactPortrait
                      ? focused
                        ? 'block w-full'
                        : 'hidden w-full'
                      : ['border-r border-border-subtle', widthClass(window.width)],
                  )}
                >
                  <article
                    className="flex h-full min-h-0 flex-col overflow-hidden bg-surface"
                    onPointerDown={() => store.actions.focus(window.instanceId)}
                    onFocusCapture={() => store.actions.focus(window.instanceId)}
                  >
                    <header
                      className={cn(
                        'flex h-10 shrink-0 items-center gap-2 px-3 transition-opacity',
                        resolveWindowHeaderTone(window.windowTypeId),
                        compactPortrait || focused ? 'opacity-100' : 'opacity-75',
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
                  </article>
                  {!compactPortrait ? (
                    <WindowResizeHandle
                      title={window.title}
                      width={window.width}
                      getContainer={() => windowStripRef.current}
                      getTrailingSpace={() => trailingSpaceRef.current}
                      onFocus={() => store.actions.focus(window.instanceId)}
                      onResize={(width) => store.actions.resize(window.instanceId, width)}
                    />
                  ) : null}
                </div>
              );
            })
          )}
          {!compactPortrait && state.windows.length > 0 ? (
            <div ref={trailingSpaceRef} aria-hidden="true" className="hidden h-full w-0 shrink-0" />
          ) : null}
        </div>
        <div
          data-edge-indicator="left"
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 z-30 w-2 bg-info/15 opacity-0 transition-opacity duration-200',
            edgeAutoScrollDirection === 'left' && 'opacity-100',
          )}
        >
          <span className="absolute inset-y-0 left-0 w-1 bg-info shadow-lg shadow-info/50 motion-safe:animate-pulse" />
        </div>
        <div
          data-edge-indicator="right"
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 z-30 w-2 bg-info/15 opacity-0 transition-opacity duration-200',
            edgeAutoScrollDirection === 'right' && 'opacity-100',
          )}
        >
          <span className="absolute inset-y-0 right-0 w-1 bg-info shadow-lg shadow-info/50 motion-safe:animate-pulse" />
        </div>
      </div>
    </section>
  );
}
