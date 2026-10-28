import { selectColumns, selectContainerForWindow } from '../core/selectors';
import type { WorkbenchStore } from '../core/store';

export type DragPayload =
  | { kind: 'window'; instanceId: string; containerId: string }
  | { kind: 'column'; containerId: string };

export interface DropTarget {
  /** Column to merge into. Omit for the empty strip. */
  containerId?: string;
  /**
   * Rail or single-window top band joins as tabs (`tabbed`).
   * Content body joins as a stack (`normal`).
   */
  mode: 'tab' | 'stack';
}

/**
 * Applies a drop using the same core actions as mouse, keyboard and menus.
 * Returns false when the drop is a no-op or unsupported.
 */
export function applyWorkbenchDrop(
  store: WorkbenchStore,
  payload: DragPayload,
  target: DropTarget,
): boolean {
  const state = store.getState();
  const columns = selectColumns(state);

  if (payload.kind === 'column') {
    const from = columns.findIndex((column) => column.id === payload.containerId);
    if (from < 0) return false;
    const to = target.containerId
      ? columns.findIndex((column) => column.id === target.containerId)
      : columns.length - 1;
    if (to < 0 || to === from) return false;
    store.actions.moveContainer(payload.containerId, to);
    return true;
  }

  const source = selectContainerForWindow(state, payload.instanceId);
  if (!source) return false;

  if (target.containerId) {
    const targetColumn = columns.find((column) => column.id === target.containerId);
    if (!targetColumn || targetColumn.id === source.id) return false;

    if (source.kind === 'floating') {
      // Docking into an existing column is not a core action yet. Use the
      // dock button first; dragging floats onto a column is a no-op.
      return false;
    }

    // The drop zone picks the display. An already-tabbed column stays tabbed
    // through merge() even for a body drop, so set the zone's display after.
    const mode = target.mode;
    const before = store.getState();
    if (source.kind === 'column' && source.windows.length === 1) {
      store.actions.merge(source.id, targetColumn.id, mode);
    } else {
      store.actions.moveToColumn(payload.instanceId, targetColumn.id);
    }
    if (store.getState() === before) return false;
    store.actions.setDisplay(targetColumn.id, mode === 'tab' ? 'tabbed' : 'normal');
    return true;
  }

  if (source.kind === 'floating') {
    store.actions.dock(source.id);
  } else {
    store.actions.moveToNewColumn(payload.instanceId, columns.length);
  }
  return true;
}
