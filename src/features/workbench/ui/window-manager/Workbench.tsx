import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  selectActiveWindowId,
  selectColumns,
  selectFloating,
  selectFocusedContainer,
} from '../../model/window-manager/selectors';
import { ColumnView } from './ColumnView';
import { useWorkbenchContext, useWorkbenchState } from './context';
import { applyWorkbenchDrop } from './drag';
import { WorkbenchDragProvider, useWorkbenchDrag } from './drag-context';
import { EmptyWorkspace } from './EmptyWorkspace';
import { FloatingWindow } from './FloatingWindow';
import { useLauncher, WorkbenchLauncherProvider } from './Launcher';
import { NarrowLayout } from './NarrowLayout';
import { alignContainerInStrip } from './scroll-container';
import { WorkbenchTaskbar } from './Taskbar';
import { useHorizontalWheel } from './useHorizontalWheel';
import { useNarrow } from './useNarrow';
import { useWorkbenchKeyboard } from './useWorkbenchKeyboard';
import { cn } from './utils';
import { WindowHosts } from './WindowHosts';

export interface WorkbenchProps {
  /** Host toolbar content. The WM owns the fixed toolbar container. */
  toolbar?: ReactNode;
  /** Extra leading content for the taskbar, for example a launcher button. */
  taskbarLeading?: ReactNode;
  /** Replace the default empty state. */
  empty?: ReactNode;
  showTaskbar?: boolean;
  /** Enable the default Ctrl/Shift/Alt arrow keymap. Defaults to true. */
  keyboard?: boolean;
  /** Called by Ctrl+Alt+Escape from anywhere, including editors. */
  onEscape?: () => void;
  /** Force the narrow projection; otherwise derived from the viewport. */
  narrow?: boolean;
  className?: string;
}

function WorkbenchBody({
  toolbar,
  taskbarLeading,
  empty,
  showTaskbar = true,
  keyboard = true,
  onEscape,
  narrow: narrowProp,
  className,
}: WorkbenchProps) {
  const { store, messages } = useWorkbenchContext();
  const launcher = useLauncher();
  const drag = useWorkbenchDrag();
  const state = useWorkbenchState();
  const [stageDrop, setStageDrop] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const mediaNarrow = useNarrow();
  const narrow = narrowProp ?? mediaNarrow;
  const [narrowContainerId, setNarrowContainerId] = useState<string | null>(null);
  const focusedContainerId = selectFocusedContainer(state)?.id;

  useHorizontalWheel(stageRef, stripRef, !narrow);
  useWorkbenchKeyboard(store, rootRef, { enabled: keyboard, onEscape });

  useEffect(() => {
    if (!narrow || !focusedContainerId) return;
    setNarrowContainerId((current) =>
      current === focusedContainerId ? current : focusedContainerId,
    );
  }, [narrow, focusedContainerId]);

  // Keep the focused column inside the strip. Alignment uses the column box,
  // not the portaled window, and does not scroll anything inside the window.
  useEffect(() => {
    const strip = stripRef.current;
    const focusedId = state.focus.focusedWindowId;
    if (!strip || !focusedId || narrow || state.focus.layer === 'floating') return;
    const escape =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(focusedId)
        : focusedId;
    const slot = strip.querySelector<HTMLElement>(`[data-wm-slot="${escape}"]`);
    const column = slot?.closest<HTMLElement>('.wm-column');
    if (!column) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    alignContainerInStrip(strip, column, reduceMotion ? 'auto' : 'smooth');
  }, [state.focus.focusedWindowId, state.focus.layer, state.containers, narrow]);

  useEffect(() => {
    if (!drag.payload) setStageDrop(false);
  }, [drag.payload]);

  const columns = selectColumns(state);
  const floats = selectFloating(state);

  return (
    <div className={cn('wm-root', className)} ref={rootRef}>
      {toolbar ? <div className="wm-toolbar">{toolbar}</div> : null}
      <div
        className="wm-stage"
        ref={stageRef}
        data-drop={stageDrop || undefined}
        onDragOver={(event) => {
          if (!drag.payload) return;
          if (event.target instanceof Element && event.target.closest('.wm-column')) {
            return;
          }
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          setStageDrop(true);
        }}
        onDragLeave={(event) => {
          if (
            event.relatedTarget instanceof Node &&
            event.currentTarget.contains(event.relatedTarget)
          ) {
            return;
          }
          setStageDrop(false);
        }}
        onDrop={(event) => {
          if (!drag.payload) return;
          if (event.target instanceof Element && event.target.closest('.wm-column')) {
            return;
          }
          event.preventDefault();
          setStageDrop(false);
          applyWorkbenchDrop(store, drag.payload, { mode: 'stack' });
          drag.end();
        }}
      >
        {narrow ? (
          <NarrowLayout
            state={state}
            activeContainerId={narrowContainerId}
            empty={empty}
            onSelect={(containerId) => {
              setNarrowContainerId(containerId);
              const container = state.containers.find((candidate) => candidate.id === containerId);
              const instanceId =
                container?.kind === 'column'
                  ? selectActiveWindowId(state, container)
                  : container?.kind === 'floating'
                    ? container.window
                    : null;
              if (instanceId) store.actions.focus(instanceId);
            }}
          />
        ) : (
          <>
            <div
              className="wm-strip"
              ref={stripRef}
              role="region"
              aria-label={messages.workspaceLabel}
            >
              {columns.length === 0
                ? (empty ?? <EmptyWorkspace />)
                : columns.map((column) => (
                    <ColumnView key={column.id} column={column} state={state} />
                  ))}
            </div>
            <div className="wm-floating-layer" aria-label={messages.floatingLayer}>
              {floats.map((container) => (
                <FloatingWindow key={container.id} container={container} state={state} />
              ))}
            </div>
          </>
        )}
      </div>
      <WindowHosts state={state} rootRef={rootRef} />
      {showTaskbar ? (
        <WorkbenchTaskbar leading={taskbarLeading} onOpenLauncher={() => launcher.open()} />
      ) : null}
    </div>
  );
}

export function Workbench(props: WorkbenchProps) {
  return (
    <WorkbenchLauncherProvider>
      <WorkbenchDragProvider>
        <WorkbenchBody {...props} />
      </WorkbenchDragProvider>
    </WorkbenchLauncherProvider>
  );
}
