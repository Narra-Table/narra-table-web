import {
  useEffect,
  useState,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { selectActiveWindowId, selectContainerState } from '../core/selectors';
import type { ColumnContainer, WindowInstance, WorkspaceState } from '../core/types';
import { useWorkbenchContext } from './context';
import { applyWorkbenchDrop } from './drag';
import { useWorkbenchDrag } from './drag-context';
import { useLauncher } from './Launcher';
import { TrafficLights, WorkbenchContextMenu, WorkbenchMenu, WorkbenchMenuItem } from './Menu';
import { defaultWidthLabel, type RegisteredWindow, type WindowMenu } from './types';
import { shortTitle } from './utils';
import { WindowIcon } from './WindowFrame';
import { WindowSlot } from './WindowSlot';

function hasDeclaredIcon(
  window: WindowInstance | undefined,
  descriptor: RegisteredWindow | undefined,
): boolean {
  return Boolean(window?.icon || descriptor?.icon || descriptor?.appIcon);
}

function AttentionMark({ level }: { level: 'info' | 'urgent' }) {
  return (
    <span className={`wm-attention wm-attention-${level}`} aria-label={`attention: ${level}`}>
      {level === 'urgent' ? '!' : '•'}
    </span>
  );
}

function setDragTransfer(event: ReactDragEvent<HTMLElement>, text: string) {
  const transfer = event.dataTransfer;
  if (!transfer) return;
  transfer.effectAllowed = 'move';
  transfer.setData('text/plain', text);
}

function WindowMenus({ menus }: { menus: readonly WindowMenu[] | undefined }) {
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

function ColumnMenuItems({
  column,
  activeId,
}: {
  column: ColumnContainer;
  activeId: string | null;
}) {
  const { store, messages, config } = useWorkbenchContext();
  const launcher = useLauncher();
  const multiple = column.windows.length > 1;
  return (
    <>
      <span className="wm-menu-label">{messages.width}</span>
      {config.widthPresets.map((width) => (
        <WorkbenchMenuItem key={width} onSelect={() => store.actions.setWidth(column.id, width)}>
          {defaultWidthLabel(width)}
        </WorkbenchMenuItem>
      ))}
      <span className="wm-menu-separator" role="separator" />
      <WorkbenchMenuItem
        onSelect={() =>
          store.actions.setDisplay(column.id, column.display === 'normal' ? 'tabbed' : 'normal')
        }
      >
        {column.display === 'normal' ? messages.switchToTabs : messages.switchToStack}
      </WorkbenchMenuItem>
      {activeId ? (
        <WorkbenchMenuItem onSelect={() => store.actions.float(activeId)}>
          {messages.float}
        </WorkbenchMenuItem>
      ) : null}
      {multiple ? (
        <WorkbenchMenuItem onSelect={() => store.actions.dissolve(column.id)}>
          {messages.dissolve}
        </WorkbenchMenuItem>
      ) : null}
      <span className="wm-menu-separator" role="separator" />
      <WorkbenchMenuItem onSelect={() => launcher.open({ containerId: column.id })}>
        {messages.launcherAddToContainer}
      </WorkbenchMenuItem>
    </>
  );
}

function keepsNativeMenu(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('.wm-window-body, input, textarea, select, [contenteditable="true"]'),
  );
}

function DropOverlay({
  layout,
  hot,
  tabLabel,
  stackLabel,
}: {
  layout: 'band' | 'rail';
  hot: 'tab' | 'stack';
  tabLabel: string;
  stackLabel: string;
}) {
  return (
    <div className="wm-drop-overlay" data-layout={layout} data-hot={hot} aria-hidden="true">
      {layout === 'rail' ? (
        <div className="wm-drop-zone wm-drop-zone-rail" data-hot={hot === 'tab' ? 'true' : 'false'}>
          <span className="wm-drop-zone-label">{tabLabel}</span>
        </div>
      ) : (
        <div className="wm-drop-zone wm-drop-zone-band" data-hot={hot === 'tab' ? 'true' : 'false'}>
          <span className="wm-drop-zone-label">{tabLabel}</span>
        </div>
      )}
      <div className="wm-drop-zone wm-drop-zone-body" data-hot={hot === 'stack' ? 'true' : 'false'}>
        <span className="wm-drop-zone-label">{stackLabel}</span>
      </div>
    </div>
  );
}

export function ColumnView({
  column,
  state,
  narrow = false,
}: {
  column: ColumnContainer;
  state: WorkspaceState;
  narrow?: boolean;
}) {
  const { store, messages, registry } = useWorkbenchContext();
  const launcher = useLauncher();
  const drag = useWorkbenchDrag();
  const [dropMode, setDropMode] = useState<'tab' | 'stack' | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const containerState = selectContainerState(column);
  const activeId = selectActiveWindowId(state, column);
  const activeWindow = activeId ? state.windows[activeId] : undefined;
  const activeDescriptor = activeWindow
    ? registry.getWindow(activeWindow.appId, activeWindow.windowTypeId)
    : undefined;
  const focusedInColumn = state.focus.focusedWindowId
    ? column.windows.includes(state.focus.focusedWindowId)
    : false;
  const multiple = column.windows.length > 1;
  // `display` is the source of truth. The rail never rewrites it, and a
  // stacked column is not projected into a single pane.
  const paged = column.display === 'tabbed';
  const stacked = !paged && multiple;

  // dragend does not fire dragleave, so a hovered stack hint would stay up.
  useEffect(() => {
    if (!drag.payload) setDropMode(null);
  }, [drag.payload]);

  const focusActive = () => {
    if (activeId) store.actions.focus(activeId);
  };

  const startColumnDrag = (event: ReactDragEvent<HTMLElement>) => {
    drag.start({ kind: 'column', containerId: column.id });
    setDragTransfer(event, activeWindow?.title ?? '');
  };

  const startWindowDrag = (event: ReactDragEvent<HTMLElement>, instanceId: string) => {
    drag.start({ kind: 'window', instanceId, containerId: column.id });
    setDragTransfer(event, state.windows[instanceId]?.title ?? instanceId);
  };

  const allowDrop = (event: ReactDragEvent<HTMLElement>, mode: 'tab' | 'stack') => {
    if (!drag.payload) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    setDropMode(mode);
  };

  const dropInto = (event: ReactDragEvent<HTMLElement>, mode: 'tab' | 'stack') => {
    if (!drag.payload) return;
    event.preventDefault();
    event.stopPropagation();
    setDropMode(null);
    applyWorkbenchDrop(store, drag.payload, { containerId: column.id, mode });
    drag.end();
  };

  const closeActive = () => {
    if (activeId) store.actions.close(activeId);
  };

  const openContextMenu = (event: ReactMouseEvent<HTMLElement>) => {
    if (keepsNativeMenu(event.target)) return;
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  return (
    <section
      className="wm-column"
      data-state={containerState}
      data-focused={focusedInColumn}
      data-narrow={narrow || undefined}
      aria-label={messages[containerState]}
      style={{ width: narrow ? '100%' : `${column.width * 100}%` }}
      onContextMenu={openContextMenu}
      onDragLeave={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          event.currentTarget.contains(event.relatedTarget)
        ) {
          return;
        }
        setDropMode(null);
      }}
    >
      <header
        className="wm-column-chrome"
        data-drop-zone={multiple ? undefined : 'tab'}
        onDragOver={(event) => {
          if (!drag.payload) return;
          // With a rail, only the rail joins as tabs. A single window still
          // uses this top band, matching the old header-vs-body split.
          if (multiple) {
            setDropMode(null);
            return;
          }
          allowDrop(event, 'tab');
        }}
        onDrop={(event) => {
          if (multiple) return;
          dropInto(event, 'tab');
        }}
      >
        <div className="wm-chrome-leading">
          <button
            type="button"
            className="wm-chrome-drag"
            draggable
            onPointerDown={focusActive}
            onDragStart={startColumnDrag}
            onDragEnd={drag.end}
          >
            {activeWindow ? (
              <WindowIcon window={activeWindow} descriptor={activeDescriptor} />
            ) : null}
            <span className="wm-chrome-title">{activeWindow?.title ?? ''}</span>
            {activeWindow?.attention ? (
              <AttentionMark level={activeWindow.attention.level} />
            ) : null}
          </button>
          <WindowMenus menus={activeDescriptor?.menus} />
        </div>
        <TrafficLights
          widthPressed={!(column.width < 1)}
          onWidth={() => store.actions.toggleFullWidth(column.id)}
          onClose={closeActive}
          menu={<ColumnMenuItems column={column} activeId={activeId} />}
        />
      </header>

      <div className="wm-column-main">
        {multiple ? (
          <aside
            className="wm-rail"
            role="tablist"
            aria-orientation="vertical"
            aria-label={paged ? messages.paged : messages.stacked}
            data-drop-zone="tab"
            onDragOver={(event) => allowDrop(event, 'tab')}
            onDrop={(event) => dropInto(event, 'tab')}
          >
            <div className="wm-rail-list">
              {column.windows.map((instanceId) => {
                const window = state.windows[instanceId];
                const descriptor = window
                  ? registry.getWindow(window.appId, window.windowTypeId)
                  : undefined;
                const title = window?.title ?? instanceId;
                const active = instanceId === activeId;
                return (
                  <div className="wm-rail-item" data-active={active} key={instanceId}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-label={title}
                      title={title}
                      className="wm-rail-tab"
                      draggable
                      onDragStart={(event) => startWindowDrag(event, instanceId)}
                      onDragEnd={drag.end}
                      onClick={() => {
                        store.actions.focus(instanceId);
                      }}
                    >
                      {window && hasDeclaredIcon(window, descriptor) ? (
                        <WindowIcon
                          window={window}
                          descriptor={descriptor}
                          className="wm-window-icon-small"
                        />
                      ) : (
                        <span className="wm-rail-label">{shortTitle(title)}</span>
                      )}
                      {window?.attention ? <AttentionMark level={window.attention.level} /> : null}
                    </button>
                    <button
                      type="button"
                      className="wm-rail-close"
                      aria-label={`${messages.close}: ${title}`}
                      onClick={() => store.actions.close(instanceId)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="wm-rail-add"
              aria-label={messages.launcher}
              title={messages.launcher}
              onClick={() => launcher.open({ containerId: column.id })}
            >
              +
            </button>
          </aside>
        ) : null}

        <div
          className="wm-column-content"
          data-drop-zone="stack"
          onDragOver={(event) => allowDrop(event, 'stack')}
          onDrop={(event) => dropInto(event, 'stack')}
        >
          {paged ? (
            <div className="wm-column-body" role="tabpanel">
              {activeId ? <WindowSlot instanceId={activeId} /> : null}
            </div>
          ) : stacked ? (
            <div className="wm-stack">
              {column.windows.map((instanceId, index) => (
                <div
                  className="wm-stack-row"
                  key={instanceId}
                  data-wm-row={instanceId}
                  data-focused={state.focus.focusedWindowId === instanceId}
                  style={{ flexGrow: column.heights?.[index] ?? 1 }}
                >
                  <WindowSlot instanceId={instanceId} />
                </div>
              ))}
            </div>
          ) : (
            <div className="wm-column-body">
              {activeId ? <WindowSlot instanceId={activeId} /> : null}
            </div>
          )}
        </div>
      </div>

      {contextMenu ? (
        <WorkbenchContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        >
          <ColumnMenuItems column={column} activeId={activeId} />
        </WorkbenchContextMenu>
      ) : null}

      {dropMode ? (
        <DropOverlay
          layout={multiple ? 'rail' : 'band'}
          hot={dropMode}
          tabLabel={messages.paged}
          stackLabel={messages.stacked}
        />
      ) : null}
    </section>
  );
}
