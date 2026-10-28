import type { FloatingContainer, WorkspaceState } from '../model/types';
import { WindowSlot } from './WindowSlot';

export function FloatingWindow({
  container,
  state,
}: {
  container: FloatingContainer;
  state: WorkspaceState;
}) {
  return (
    <div
      className="wm-floating"
      data-focused={state.focus.focusedWindowId === container.window}
      style={{
        left: container.x,
        top: container.y,
        width: container.width,
        height: container.height,
        zIndex: container.zOrder,
      }}
    >
      <WindowSlot instanceId={container.window} />
    </div>
  );
}
