import { useNavigate } from '@tanstack/react-router';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useGetApiSpacesSpaceIdRooms } from '@/api';
import {
  WindowManager,
  useWindowManagerStore,
  type WindowInstance,
} from '@/features/window-manager';
import { useWindowEdgeAutoScroll } from '@/lib/useWindowBehaviorSettings';
import { useSpacePersistence } from '../hooks/useSpacePersistence';
import { createSpaceRuntime, openKind } from '../lib/persistence';
import { isSpaceWindowKind, type WindowKind } from '../model/window';
import { SpaceTopbar } from './SpaceTopbar';

const WindowContent = lazy(() =>
  import('./windows/WindowContent').then((module) => ({ default: module.WindowContent })),
);

export function SpacePage({ spaceId }: { spaceId: string }) {
  const navigate = useNavigate();
  const [runtime] = useState(() => createSpaceRuntime(spaceId));
  const [activeRoomId, setActiveRoomId] = useState<string>();
  const [visibleWindowIds, setVisibleWindowIds] = useState<readonly string[]>([]);
  const { manager, workspace } = runtime;
  const managerState = useWindowManagerStore(manager);
  const edgeAutoScroll = useWindowEdgeAutoScroll();
  const openWindow = useCallback((kind: WindowKind) => openKind(workspace, kind), [workspace]);
  const { data: chatRooms = [] } = useGetApiSpacesSpaceIdRooms(spaceId, {
    query: { select: (response) => response.data.rooms },
  });

  useEffect(() => {
    if (!chatRooms.length) {
      setActiveRoomId(undefined);
      return;
    }
    if (!chatRooms.some((room) => room.roomId === activeRoomId)) {
      setActiveRoomId(chatRooms[0].roomId);
    }
  }, [activeRoomId, chatRooms]);

  useSpacePersistence(spaceId, manager);

  function renderWindow(window: WindowInstance) {
    if (!isSpaceWindowKind(window.windowTypeId)) return null;
    return (
      <Suspense fallback={<div className="p-4 text-sm text-text-muted">加载中</div>}>
        <WindowContent kind={window.windowTypeId} spaceId={spaceId} activeRoomId={activeRoomId} />
      </Suspense>
    );
  }

  function renderWindowOverlay(window: WindowInstance) {
    if (window.windowTypeId !== 'chat' || !chatRooms.length) return null;
    return (
      <select
        aria-label="切换聊天房间"
        value={activeRoomId}
        className="min-w-0 max-w-48 bg-surface px-2 py-1 text-xs text-text outline-none"
        onChange={(event) => setActiveRoomId(event.target.value)}
      >
        {chatRooms.map((room) => (
          <option key={room.roomId} value={room.roomId}>
            {room.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <WindowManager
        edgeAutoScroll={edgeAutoScroll}
        onVisibleWindowsChange={setVisibleWindowIds}
        store={manager}
        topbar={
          <SpaceTopbar
            windows={managerState.windows}
            focusedWindowId={managerState.focusedWindowId}
            visibleWindowIds={visibleWindowIds}
            onBack={() => void navigate({ to: '/' })}
            onAddWindow={openWindow}
            onFocusWindow={(instanceId) => manager.actions.focus(instanceId)}
          />
        }
        renderWindow={renderWindow}
        renderWindowOverlay={renderWindowOverlay}
      />
    </div>
  );
}
