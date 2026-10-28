import type { ReactNode } from 'react';
import {
  selectActiveWindowId,
  selectColumns,
  selectContainerState,
  selectFloating,
} from '../model/selectors';
import type { WorkspaceState } from '../model/types';
import { ColumnView } from './ColumnView';
import { useWorkbenchContext } from './context';
import { EmptyWorkspace } from './EmptyWorkspace';
import { WindowSlot } from './WindowSlot';

export function NarrowLayout({
  state,
  activeContainerId,
  onSelect,
  empty,
}: {
  state: WorkspaceState;
  activeContainerId: string | null;
  onSelect: (containerId: string) => void;
  empty?: ReactNode;
}) {
  const { messages } = useWorkbenchContext();
  const columns = selectColumns(state);
  const floats = selectFloating(state);
  const active =
    state.containers.find((container) => container.id === activeContainerId) ??
    columns[0] ??
    floats[floats.length - 1];
  const activeColumn = active?.kind === 'column' ? active : undefined;
  const activeFloat = active?.kind === 'floating' ? active : undefined;

  return (
    <div className="wm-narrow">
      <div className="wm-narrow-tabs" role="tablist" aria-label={messages.workspaceLabel}>
        {columns.map((column) => {
          const activeId = selectActiveWindowId(state, column);
          const window = activeId ? state.windows[activeId] : undefined;
          const containerState = selectContainerState(column);
          return (
            <button
              type="button"
              role="tab"
              key={column.id}
              aria-selected={active?.id === column.id}
              className="wm-narrow-tab"
              onClick={() => onSelect(column.id)}
            >
              <span className={`wm-state-badge wm-state-${containerState}`}>
                {messages[containerState]}
              </span>
              {window?.title ?? ''}
            </button>
          );
        })}
        {floats.map((container) => {
          const window = state.windows[container.window];
          return (
            <button
              type="button"
              role="tab"
              key={container.id}
              aria-selected={active?.id === container.id}
              className="wm-narrow-tab"
              onClick={() => onSelect(container.id)}
            >
              <span className="wm-state-badge wm-state-floating">{messages.floating}</span>
              {window?.title ?? ''}
            </button>
          );
        })}
      </div>

      <div className="wm-narrow-stage">
        {/* The horizontal strip switches containers. Inside the column, the
            vertical rail manages windows; stacked rows stay visible together. */}
        {activeColumn ? <ColumnView column={activeColumn} state={state} narrow /> : null}
        {activeFloat ? (
          <div className="wm-narrow-sheet">
            <WindowSlot instanceId={activeFloat.window} />
          </div>
        ) : null}
        {!active ? (empty ?? <EmptyWorkspace />) : null}
      </div>
    </div>
  );
}
