import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { WorkspaceState } from '../core/types';
import { WindowFrame } from './WindowFrame';

function WindowHost({
  instanceId,
  state,
  rootRef,
}: {
  instanceId: string;
  state: WorkspaceState;
  rootRef: RefObject<HTMLDivElement | null>;
}) {
  const [target] = useState<HTMLDivElement | null>(() => {
    if (typeof document === 'undefined') return null;
    const element = document.createElement('div');
    element.className = 'wm-window-portal';
    return element;
  });

  const place = useCallback(() => {
    if (!target) return;
    const root = rootRef.current;
    if (!root) return;

    const slot = [...root.querySelectorAll<HTMLElement>('[data-wm-slot]')].find(
      (element) => element.dataset.wmSlot === instanceId,
    );
    const storage = root.querySelector<HTMLElement>('[data-wm-window-storage]');
    const parent = slot ?? storage;
    if (!parent) return;
    if (target.parentElement !== parent) parent.appendChild(target);
  }, [instanceId, target, rootRef]);

  // Re-place on every commit. Narrow/wide swaps the slot nodes without
  // changing workspace state, so a state-only effect would leave the portal
  // attached to a column that just unmounted.
  useLayoutEffect(() => {
    place();
  });
  useEffect(() => {
    place();
  }, [place]);

  useEffect(
    () => () => {
      target?.remove();
    },
    [target],
  );

  if (!target) return null;
  return createPortal(<WindowFrame instanceId={instanceId} state={state} />, target);
}

/**
 * Renders every window frame exactly once. Slots in columns/floating windows
 * receive the portal target, so moving or hiding a window never remounts its
 * content.
 */
export function WindowHosts({
  state,
  rootRef,
}: {
  state: WorkspaceState;
  rootRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="wm-window-storage" data-wm-window-storage>
      {Object.keys(state.windows).map((instanceId) => (
        <WindowHost key={instanceId} instanceId={instanceId} state={state} rootRef={rootRef} />
      ))}
    </div>
  );
}
