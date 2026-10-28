import {
  Component,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { findContainerForWindow } from '../core/state';
import type { WindowInstance, WorkspaceState } from '../core/types';
import { useWorkbenchContext } from './context';
import { TrafficLights, WorkbenchContextMenu, WorkbenchMenu, WorkbenchMenuItem } from './Menu';
import type { RegisteredWindow, WindowRenderContext } from './types';
import { cn } from './utils';

class WindowErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Calls the host renderer inside the boundary. Evaluating it in WindowFrame
 * itself would throw before the boundary could catch it.
 */
function WindowContent({
  window,
  context,
}: {
  window: WindowInstance;
  context: WindowRenderContext;
}) {
  const { renderWindow } = useWorkbenchContext();
  return <>{renderWindow(window, context)}</>;
}

export function WindowIcon({
  window,
  descriptor,
  className,
}: {
  window: WindowInstance;
  descriptor?: RegisteredWindow;
  className?: string;
}) {
  const { renderIcon } = useWorkbenchContext();
  if (renderIcon) {
    return (
      <span className={cn('wm-window-icon', className)} aria-hidden="true">
        {renderIcon(descriptor, window)}
      </span>
    );
  }
  const label = window.icon ?? descriptor?.appIcon ?? descriptor?.icon ?? window.title.slice(0, 1);
  return (
    <span className={cn('wm-window-icon', className)} aria-hidden="true">
      {label}
    </span>
  );
}

export interface WindowFrameProps {
  instanceId: string;
  state: WorkspaceState;
}

function pointerPoint(event: ReactPointerEvent<HTMLElement>): {
  button: number;
  pointerId: number;
  clientX: number;
  clientY: number;
} {
  const native = event.nativeEvent;
  const button = event.button ?? ('button' in native ? native.button : 0);
  const pointerId =
    event.pointerId ?? ('pointerId' in native ? (native as PointerEvent).pointerId : 0);
  return {
    button,
    pointerId,
    clientX: Number.isFinite(event.clientX) ? event.clientX : native.clientX,
    clientY: Number.isFinite(event.clientY) ? event.clientY : native.clientY,
  };
}

function DeclaredMenus({ descriptor }: { descriptor: RegisteredWindow | undefined }) {
  const menus = descriptor?.menus;
  if (!menus || menus.length === 0) return null;
  return (
    <div className="wm-chrome-menus">
      {menus.map((menu, index) => (
        <WorkbenchMenu
          key={`${menu.label}-${index}`}
          label={menu.label}
          align="start"
          trigger={menu.label}
        >
          {menu.items.map((item, itemIndex) => (
            <WorkbenchMenuItem
              key={`${item.label}-${itemIndex}`}
              disabled={item.disabled}
              onSelect={() => item.onSelect?.()}
            >
              {item.label}
            </WorkbenchMenuItem>
          ))}
        </WorkbenchMenu>
      ))}
    </div>
  );
}

export function WindowFrame({ instanceId, state }: WindowFrameProps) {
  const { store, registry, messages } = useWorkbenchContext();
  const floatDrag = useRef<{
    pointerId: number;
    originX: number;
    originY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const window = state.windows[instanceId];
  if (!window) return null;

  const container = findContainerForWindow(state, instanceId);
  const descriptor = registry.getWindow(window.appId, window.windowTypeId);
  const focused = state.focus.focusedWindowId === instanceId;
  const attention = window.attention;
  const floating = container?.kind === 'floating';

  const onFloatPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    const point = pointerPoint(event);
    if (!container || container.kind !== 'floating' || point.button !== 0) return;
    event.preventDefault();
    floatDrag.current = {
      pointerId: point.pointerId,
      originX: point.clientX,
      originY: point.clientY,
      startX: container.x,
      startY: container.y,
    };
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      try {
        event.currentTarget.setPointerCapture(point.pointerId);
      } catch {
        // jsdom rejects capture when the pointer is not in the hit-test set.
      }
    }
  };

  const onFloatPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const active = floatDrag.current;
    const point = pointerPoint(event);
    if (!active || active.pointerId !== point.pointerId || !container) return;
    store.actions.moveFloating(
      container.id,
      active.startX + point.clientX - active.originX,
      active.startY + point.clientY - active.originY,
    );
  };

  const onFloatPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (floatDrag.current?.pointerId !== pointerPoint(event).pointerId) return;
    floatDrag.current = null;
  };

  const focus = () => {
    if (state.focus.focusedWindowId !== instanceId) {
      store.actions.focus(instanceId);
    }
  };

  const content = (
    <WindowErrorBoundary fallback={<div className="wm-window-error">{messages.renderError}</div>}>
      <WindowContent window={window} context={{ focused, container, state }} />
    </WindowErrorBoundary>
  );

  return (
    <article
      className="wm-window"
      data-focused={focused}
      data-chrome={window.chrome}
      data-attention={attention?.level}
      aria-label={window.title}
      onPointerDown={focus}
      onFocusCapture={focus}
    >
      {floating ? (
        <header
          className="wm-window-chrome"
          onContextMenu={(event: ReactMouseEvent<HTMLElement>) => {
            event.preventDefault();
            event.stopPropagation();
            setContextMenu({ x: event.clientX, y: event.clientY });
          }}
        >
          <div className="wm-chrome-leading">
            <button
              type="button"
              className="wm-chrome-drag"
              onPointerDown={onFloatPointerDown}
              onPointerMove={onFloatPointerMove}
              onPointerUp={onFloatPointerUp}
              onPointerCancel={onFloatPointerUp}
            >
              <WindowIcon window={window} descriptor={descriptor} />
              <span className="wm-chrome-title">{window.title}</span>
              {attention ? (
                <span
                  className={`wm-attention wm-attention-${attention.level}`}
                  aria-label={`attention: ${attention.level}`}
                >
                  {attention.level === 'urgent' ? '!' : '•'}
                </span>
              ) : null}
            </button>
            <DeclaredMenus descriptor={descriptor} />
          </div>
          <TrafficLights
            widthDisabled
            onClose={() => store.actions.close(instanceId)}
            menu={
              container ? (
                <WorkbenchMenuItem onSelect={() => store.actions.dock(container.id)}>
                  {messages.dock}
                </WorkbenchMenuItem>
              ) : null
            }
          />
        </header>
      ) : null}
      {floating && contextMenu && container ? (
        <WorkbenchContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        >
          <WorkbenchMenuItem onSelect={() => store.actions.dock(container.id)}>
            {messages.dock}
          </WorkbenchMenuItem>
        </WorkbenchContextMenu>
      ) : null}
      <div className="wm-window-body">{content}</div>
    </article>
  );
}
