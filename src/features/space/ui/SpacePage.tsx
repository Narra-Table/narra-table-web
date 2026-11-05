import { useNavigate } from '@tanstack/react-router';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useGetApiSpacesSpaceIdRooms } from '@/api';
import { useAppToolbar, type AppToolbarDefinition } from '@/features/app-toolbar';
import {
  WindowManager,
  useWindowManagerStore,
  type WindowInstance,
} from '@/features/window-manager';
import { useSpacePersistence } from '../hooks/useSpacePersistence';
import { createSpaceRuntime, openKind } from '../lib/persistence';
import { isSpaceWindowKind, WINDOW_INFO, WINDOW_KINDS, type WindowKind } from '../model/window';

const WindowContent = lazy(() =>
  import('./windows/WindowContent').then((module) => ({ default: module.WindowContent })),
);

const WINDOW_SEARCH: Partial<Record<WindowKind, { label: string; placeholder: string }>> = {
  characters: { label: '搜索空间角色', placeholder: '搜索空间角色' },
  members: { label: '搜索空间成员', placeholder: '搜索空间成员' },
  clues: { label: '搜索线索', placeholder: '搜索线索' },
  combat: { label: '搜索参战角色', placeholder: '搜索参战角色' },
};

export function SpacePage({ spaceId }: { spaceId: string }) {
  const navigate = useNavigate();
  const [runtime] = useState(() => createSpaceRuntime(spaceId));
  const [activeRoomId, setActiveRoomId] = useState<string>();
  const [chatDraft, setChatDraft] = useState('');
  const [queries, setQueries] = useState<Partial<Record<WindowKind, string>>>({});
  const { manager, workspace } = runtime;
  const managerState = useWindowManagerStore(manager);
  const focusedWindow = managerState.windows.find(
    (window) => window.instanceId === managerState.focusedWindowId,
  );
  const focusedKind =
    focusedWindow && isSpaceWindowKind(focusedWindow.windowTypeId)
      ? focusedWindow.windowTypeId
      : undefined;
  const openWindow = useCallback((kind: WindowKind) => openKind(workspace, kind), [workspace]);
  const setFocusedQuery = useCallback(
    (query: string) => {
      if (!focusedKind) return;
      setQueries((current) => ({ ...current, [focusedKind]: query }));
    },
    [focusedKind],
  );
  const { data: chatRooms = [] } = useGetApiSpacesSpaceIdRooms(spaceId, {
    query: { select: (response) => response.data.rooms },
  });
  const activeRoomName = chatRooms.find((room) => room.roomId === activeRoomId)?.name;
  const toolbar = useMemo<AppToolbarDefinition>(() => {
    const search = focusedKind ? WINDOW_SEARCH[focusedKind] : undefined;
    const content: AppToolbarDefinition['content'] =
      focusedKind === 'chat'
        ? {
            kind: 'chat-switcher',
            message: {
              label: '聊天输入',
              placeholder: '输入消息',
              value: chatDraft,
              onChange: setChatDraft,
            },
            search: {
              label: '搜索聊天记录',
              placeholder: `搜索${activeRoomName ? `「${activeRoomName}」` : '当前房间'}聊天记录`,
              value: queries.chat ?? '',
              onChange: setFocusedQuery,
            },
          }
        : focusedKind && search
          ? {
              kind: 'search',
              label: search.label,
              placeholder: search.placeholder,
              value: queries[focusedKind] ?? '',
              onChange: setFocusedQuery,
            }
          : undefined;

    return {
      placement: 'docked',
      leadingAction: {
        label: '返回空间列表',
        icon: 'back',
        onTrigger: () => void navigate({ to: '/' }),
      },
      content,
      menu: {
        label: '添加窗口',
        items: WINDOW_KINDS.map((kind) => ({
          id: kind,
          label: WINDOW_INFO[kind].title,
          active: kind === focusedKind,
          onSelect: () => openWindow(kind),
        })),
      },
    };
  }, [activeRoomName, chatDraft, focusedKind, navigate, openWindow, queries, setFocusedQuery]);

  useEffect(() => {
    if (!chatRooms.length) {
      setActiveRoomId(undefined);
      return;
    }
    if (!chatRooms.some((room) => room.roomId === activeRoomId)) {
      setActiveRoomId(chatRooms[0].roomId);
    }
  }, [activeRoomId, chatRooms]);

  useAppToolbar(toolbar);
  useSpacePersistence(spaceId, manager);

  function renderWindow(window: WindowInstance) {
    if (!isSpaceWindowKind(window.windowTypeId)) return null;
    return (
      <Suspense fallback={<div className="p-4 text-sm text-text-muted">加载中</div>}>
        <WindowContent
          kind={window.windowTypeId}
          spaceId={spaceId}
          activeRoomId={activeRoomId}
          query={queries[window.windowTypeId] ?? ''}
        />
      </Suspense>
    );
  }

  function renderWindowHeaderAddon(window: WindowInstance) {
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
    <div className="h-full min-h-0 overflow-hidden pb-13">
      <WindowManager
        store={manager}
        renderWindow={renderWindow}
        renderWindowHeaderAddon={renderWindowHeaderAddon}
      />
    </div>
  );
}
