import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useGetApiSpacesSpaceId, useGetApiSpacesSpaceIdRooms } from '@/api';
import {
  selectFocusedWindow,
  useWorkbenchStore,
  Workbench,
  WorkbenchProvider,
  type WindowInstance,
  type WorkbenchMessages,
} from '@/modules/workbench';
import '@/modules/workbench/styles.css';
import './workbench.css';
import { useWorkbenchPersistence } from './hooks/useWorkbenchPersistence';
import {
  createWorkbenchStoreForSpace,
  openKind,
  readWorkbenchRoomId,
  resolveRoomId,
  writeWorkbenchRoomId,
} from './infrastructure/persistence';
import {
  findChatWindowForRoom,
  mergeChatState,
  readChatState,
  type ChatWindowState,
} from './model/chat-state';
import { isWorkbenchWindowKind, WORKBENCH_REGISTRY } from './windows/registry';
import type { WindowSeekRequest } from './windows/WindowContent';

const WindowContent = lazy(() =>
  import('./windows/WindowContent').then((module) => ({
    default: module.WindowContent,
  })),
);

function WindowFallback() {
  return <div className="p-4 text-sm text-text-muted">加载窗口…</div>;
}

function SuspendedWindow({ children }: { children: ReactNode }) {
  return <Suspense fallback={<WindowFallback />}>{children}</Suspense>;
}

const MESSAGES: Partial<WorkbenchMessages> = {
  workspaceLabel: '工作区',
  taskbarLabel: '任务栏',
  emptyTitle: '工作台是空的',
  emptyBody: '从底部的「应用」打开窗口。',
  close: '关闭',
  closeWindow: '关闭窗口',
  more: '更多',
  width: '宽度',
  fullWidth: '满宽',
  restoreWidth: '还原',
  standard: '标准',
  stacked: '堆叠',
  paged: '分页',
  floating: '悬浮',
  switchToTabs: '切换为分页',
  switchToStack: '切换为堆叠',
  dissolve: '解散',
  float: '变悬浮',
  dock: '停靠',
  floatingLayer: '悬浮层',
  launcher: '应用',
  launcherApps: '应用',
  launcherWindows: '窗口',
  launcherSearch: '搜索应用和窗口',
  launcherEmpty: '没有匹配项',
  launcherAddToContainer: '加入当前容器',
  renderError: '这个窗口加载失败。',
};

function WorkbenchToolbar({ spaceName }: { spaceName: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Link
        to="/"
        aria-label="返回空间列表"
        title="返回空间列表"
        className="grid size-8 shrink-0 place-items-center rounded-control text-text-muted hover:bg-surface-muted hover:text-text"
      >
        <ArrowLeft className="size-4" />
      </Link>
      <h1 className="min-w-0 truncate text-sm font-semibold text-text">{spaceName}</h1>
    </div>
  );
}

export function WorkbenchPage({ spaceId }: { spaceId: string }) {
  const [store] = useState(() => createWorkbenchStoreForSpace(spaceId));
  const state = useWorkbenchStore(store);
  const [roomId, setRoomId] = useState(() => readWorkbenchRoomId(spaceId));

  const roomsQuery = useGetApiSpacesSpaceIdRooms(spaceId, {
    query: { select: (response) => response.data.rooms ?? [] },
  });
  const spaceQuery = useGetApiSpacesSpaceId(spaceId, {
    query: { select: (response) => response.data },
  });
  const rooms = roomsQuery.data;
  const roomList = rooms ?? [];
  const activeRoomId = resolveRoomId(roomId, rooms);
  const spaceName = spaceQuery.data?.name?.trim() || '空间';

  const focusedWindow = selectFocusedWindow(state);
  const focusedChatState =
    focusedWindow?.windowTypeId === 'chat' ? readChatState(focusedWindow) : undefined;
  const displayRoomId = focusedChatState?.roomId || activeRoomId;

  useWorkbenchPersistence(spaceId, store);

  const updateChatState = useCallback(
    (instanceId: string, patch: ChatWindowState) => {
      const window = store.getState().windows[instanceId];
      if (!window) return;
      store.actions.setWindowState(instanceId, mergeChatState(window, patch));
    },
    [store],
  );

  useEffect(() => {
    if (!activeRoomId || activeRoomId === roomId) return;
    setRoomId(activeRoomId);
  }, [activeRoomId, roomId]);

  useEffect(() => {
    writeWorkbenchRoomId(spaceId, activeRoomId);
  }, [spaceId, activeRoomId]);

  // Initialise restored/default chat windows once the room list is known.
  useEffect(() => {
    if (!activeRoomId || !rooms || rooms.length === 0) return;
    const current = store.getState();
    for (const window of Object.values(current.windows)) {
      if (window.windowTypeId !== 'chat') continue;
      const chat = readChatState(window);
      if (chat.roomId && rooms.some((room) => room.roomId === chat.roomId)) {
        continue;
      }
      updateChatState(window.instanceId, {
        roomId: activeRoomId,
        scene: undefined,
        query: '',
      });
    }
  }, [activeRoomId, rooms, store, updateChatState]);

  function changeRoom(next: string) {
    if (!next || next === displayRoomId) return;
    setRoomId(next);
    if (focusedWindow?.windowTypeId === 'chat') {
      updateChatState(focusedWindow.instanceId, {
        roomId: next,
        scene: undefined,
        query: '',
      });
    }
  }

  function seek({ roomId: targetRoomId, query }: WindowSeekRequest) {
    const current = store.getState();
    const chat = findChatWindowForRoom(Object.values(current.windows), targetRoomId);

    if (chat) {
      updateChatState(chat.instanceId, { query });
      store.actions.focus(chat.instanceId);
      return;
    }
    openKind(store, 'chat', {
      state: { roomId: targetRoomId, scene: undefined, query },
    });
  }

  function renderWindow(window: WindowInstance) {
    if (!isWorkbenchWindowKind(window.windowTypeId)) {
      return <div className="p-4 text-sm text-text-muted">不支持的窗口类型。</div>;
    }

    if (window.windowTypeId === 'chat') {
      const chat = readChatState(window);
      return (
        <SuspendedWindow>
          <WindowContent
            kind="chat"
            spaceId={spaceId}
            roomId={chat.roomId || activeRoomId}
            rooms={roomList}
            scene={chat.scene}
            query={chat.query ?? ''}
            onRoomChange={(next) => {
              setRoomId(next);
              updateChatState(window.instanceId, {
                roomId: next,
                scene: undefined,
                query: '',
              });
            }}
            onQueryChange={(value) => updateChatState(window.instanceId, { query: value })}
            onSceneChange={(value) => updateChatState(window.instanceId, { scene: value })}
            onSeek={seek}
          />
        </SuspendedWindow>
      );
    }

    return (
      <SuspendedWindow>
        <WindowContent
          kind={window.windowTypeId}
          spaceId={spaceId}
          roomId={activeRoomId}
          rooms={roomList}
          query=""
          onRoomChange={changeRoom}
          onQueryChange={() => {}}
          onSceneChange={() => {}}
          onSeek={seek}
        />
      </SuspendedWindow>
    );
  }

  return (
    <div className="narra-workbench">
      <WorkbenchProvider
        store={store}
        registry={WORKBENCH_REGISTRY}
        renderWindow={renderWindow}
        messages={MESSAGES}
      >
        <Workbench
          toolbar={<WorkbenchToolbar spaceName={spaceName} />}
          onEscape={() => {
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          }}
        />
      </WorkbenchProvider>
    </div>
  );
}
