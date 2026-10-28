import { useEffect, type RefObject } from 'react';

/**
 * The tiling strip must not pan on the wheel or on navigation keys. Vertical
 * wheels stay with the window under the pointer. A horizontal wheel (trackpad
 * or Shift+wheel), and Arrow / Home / End / Page Up / Page Down, are cancelled
 * when they would move the strip. A nested scroller such as a tab row, a wide
 * table, or a message list keeps the gesture when it can actually move.
 */
export function useHorizontalWheel(
  stageRef: RefObject<HTMLElement | null>,
  stripRef: RefObject<HTMLElement | null>,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const stage = stageRef.current;
    const strip = stripRef.current;
    if (!stage || !strip) return;

    const onWheel = (event: WheelEvent) => {
      const horizontal = event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (!horizontal) return;

      const delta = event.shiftKey ? event.deltaY || event.deltaX : event.deltaX;
      if (delta === 0) return;

      const target = event.target;
      if (!(target instanceof Element) || !strip.contains(target)) return;

      let node: Element | null = target;
      while (node && node !== strip) {
        if (node instanceof HTMLElement && canScrollHorizontally(node, delta)) return;
        node = node.parentElement;
      }

      event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      if (event.defaultPrevented || !isStripNavKey(event.key)) return;
      if (fieldHandlesKey(event.target, event.key)) return;
      if (contentEditableKeepsKey(event.target, event.key)) return;

      const target = event.target;
      if (!(target instanceof Node) || !strip.contains(target)) return;

      let node: Element | null = target instanceof Element ? target : target.parentElement;
      while (node && node !== strip) {
        if (node instanceof HTMLElement && canConsumeKey(node, event.key)) return;
        node = node.parentElement;
      }

      event.preventDefault();
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('keydown', onKeyDown);
    return () => {
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('keydown', onKeyDown);
    };
  }, [stageRef, stripRef, enabled]);
}

const STRIP_NAV_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);

function isStripNavKey(key: string): boolean {
  return STRIP_NAV_KEYS.has(key);
}

const TEXT_INPUT_TYPES = new Set(['text', 'search', 'url', 'tel', 'password', 'email', '']);

/** True when the browser will use the key inside a native field, so cancelling it would freeze the caret. */
function fieldHandlesKey(target: EventTarget | null, key: string): boolean {
  if (target instanceof HTMLSelectElement) return true;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return false;
  if (target instanceof HTMLInputElement && !TEXT_INPUT_TYPES.has(target.type)) return true;

  const start = target.selectionStart ?? 0;
  const end = target.selectionEnd ?? 0;
  const length = target.value.length;
  const collapsed = start === end;
  switch (key) {
    case 'ArrowLeft':
      return !collapsed || start > 0;
    case 'ArrowRight':
      return !collapsed || end < length;
    case 'Home':
      return !collapsed || start > 0;
    case 'End':
      return !collapsed || end < length;
    case 'ArrowUp':
    case 'PageUp':
      return target instanceof HTMLTextAreaElement && (!collapsed || start > 0);
    case 'ArrowDown':
    case 'PageDown':
      return target instanceof HTMLTextAreaElement && (!collapsed || end < length);
    default:
      return false;
  }
}

function contentEditableRoot(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null;
  if (target.isContentEditable) return target.closest('[contenteditable="true"]') ?? target;
  return target.closest('[contenteditable="true"]');
}

/**
 * TipTap leaves in-text arrow keys to the browser. Cancelling those freezes
 * the caret. Cancel only at the edge, where the same key would pan the strip.
 */
function contentEditableKeepsKey(target: EventTarget | null, key: string): boolean {
  const root = contentEditableRoot(target);
  if (!root) return false;
  const selection = window.getSelection();
  if (
    !selection ||
    !selection.isCollapsed ||
    !selection.anchorNode ||
    !root.contains(selection.anchorNode)
  ) {
    return true;
  }
  switch (key) {
    case 'ArrowLeft':
    case 'Home':
      return !selectionAtEdge(root, 'start');
    case 'ArrowRight':
    case 'End':
      return !selectionAtEdge(root, 'end');
    case 'ArrowUp':
      return !onVerticalEdge(root, 'start');
    case 'ArrowDown':
      return !onVerticalEdge(root, 'end');
    default:
      return false;
  }
}

function selectionAtEdge(root: HTMLElement, edge: 'start' | 'end'): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  const probe = range.cloneRange();
  probe.selectNodeContents(root);
  if (edge === 'start') probe.setEnd(range.startContainer, range.startOffset);
  else probe.setStart(range.endContainer, range.endOffset);
  return probe.toString().length === 0;
}

function onVerticalEdge(root: HTMLElement, edge: 'start' | 'end'): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return selectionAtEdge(root, edge);
  const caret = selection.getRangeAt(0).getClientRects()[0];
  if (!caret || caret.height === 0) return selectionAtEdge(root, edge);
  const box = root.getBoundingClientRect();
  if (edge === 'start') return caret.top <= box.top + 2;
  return caret.bottom >= box.bottom - 2;
}

function canConsumeKey(element: HTMLElement, key: string): boolean {
  switch (key) {
    case 'ArrowLeft':
      return canScrollHorizontally(element, -1);
    case 'ArrowRight':
      return canScrollHorizontally(element, 1);
    case 'ArrowUp':
    case 'PageUp':
      return canScrollVertically(element, -1);
    case 'ArrowDown':
    case 'PageDown':
      return canScrollVertically(element, 1);
    case 'Home':
      return canScrollVertically(element, -1) || canScrollHorizontally(element, -1);
    case 'End':
      return canScrollVertically(element, 1) || canScrollHorizontally(element, 1);
    default:
      return false;
  }
}

function canScrollHorizontally(element: HTMLElement, delta: number): boolean {
  const overflow = getComputedStyle(element).overflowX;
  if (overflow !== 'auto' && overflow !== 'scroll') return false;
  if (element.scrollWidth <= element.clientWidth + 1) return false;
  if (delta < 0) return element.scrollLeft > 0;
  return element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
}

function canScrollVertically(element: HTMLElement, delta: number): boolean {
  const overflow = getComputedStyle(element).overflowY;
  if (overflow !== 'auto' && overflow !== 'scroll') return false;
  if (element.scrollHeight <= element.clientHeight + 1) return false;
  if (delta < 0) return element.scrollTop > 0;
  return element.scrollTop + element.clientHeight < element.scrollHeight - 1;
}
