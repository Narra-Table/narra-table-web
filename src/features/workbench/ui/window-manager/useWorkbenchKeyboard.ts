import { useEffect, type RefObject } from 'react';
import { equalHeights } from '../../model/window-manager/geometry';
import {
  selectActiveWindowId,
  selectAdjacentColumn,
  selectColumns,
  selectContainerForWindow,
  selectFocusedWindow,
} from '../../model/window-manager/selectors';
import { isColumnContainer } from '../../model/window-manager/state';
import type { WorkbenchStore } from '../../model/window-manager/store';
import type { Direction } from '../../model/window-manager/types';

export interface WorkbenchKeyboardOptions {
  enabled?: boolean;
  onEscape?: () => void;
}

function arrowDirection(key: string): Direction | undefined {
  switch (key) {
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    default:
      return undefined;
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  return target.closest('[contenteditable="true"]') !== null;
}

function resizeColumn(store: WorkbenchStore, direction: Direction): boolean {
  const state = store.getState();
  const focused = selectFocusedWindow(state);
  const container = focused ? selectContainerForWindow(state, focused.instanceId) : undefined;
  if (!container || !isColumnContainer(container)) return false;

  if (direction === 'left' || direction === 'right') {
    const delta = direction === 'left' ? -0.05 : 0.05;
    store.actions.setWidth(container.id, container.width + delta);
    return true;
  }

  if (container.windows.length < 2) return false;
  const activeId = selectActiveWindowId(state, container);
  const index = activeId ? container.windows.indexOf(activeId) : -1;
  if (index < 0) return false;

  const heights = container.heights ?? equalHeights(container.windows.length);
  const delta = direction === 'up' ? 0.05 : -0.05;
  const next = heights.map((height, position) =>
    position === index ? Math.max(0.1, height + delta) : height,
  );
  const total = next.reduce((sum, height) => sum + height, 0);
  store.actions.setHeights(
    container.id,
    next.map((height) => height / total),
  );
  return true;
}

function moveFocused(store: WorkbenchStore, direction: Direction): boolean {
  const state = store.getState();
  const focused = selectFocusedWindow(state);
  if (!focused) return false;
  const container = selectContainerForWindow(state, focused.instanceId);
  if (!container || !isColumnContainer(container)) return false;

  if (direction === 'left' || direction === 'right') {
    const adjacent = selectAdjacentColumn(state, container.id, direction);
    if (!adjacent) return false;
    if (container.windows.length === 1) {
      const columns = selectColumns(state);
      const index = columns.findIndex((column) => column.id === container.id);
      const target = index + (direction === 'left' ? -1 : 1);
      store.actions.moveContainer(container.id, target);
    } else {
      store.actions.moveToColumn(focused.instanceId, adjacent.id);
    }
    return true;
  }

  return false;
}

/**
 * Ctrl+Arrow focuses, Ctrl+Shift+Arrow moves, Ctrl+Alt+Arrow resizes.
 * Ctrl+Alt+Escape is the host escape hatch and is allowed inside editors.
 */
export function useWorkbenchKeyboard(
  store: WorkbenchStore,
  rootRef: RefObject<HTMLElement | null>,
  options: WorkbenchKeyboardOptions = {},
): void {
  const { enabled = true, onEscape } = options;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey) return;

      if (event.altKey && event.key === 'Escape') {
        onEscape?.();
        event.preventDefault();
        return;
      }

      if (isEditableTarget(event.target)) return;

      const direction = arrowDirection(event.key);
      if (!direction) return;

      let handled = false;
      if (event.altKey) handled = resizeColumn(store, direction);
      else if (event.shiftKey) handled = moveFocused(store, direction);
      else {
        store.actions.focusDirection(direction);
        handled = true;
      }

      if (handled) event.preventDefault();
    };

    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [store, rootRef, enabled, onEscape]);
}
