import { Link } from '@tanstack/react-router';
import { ArrowLeft, MessageSquare, Plus, Search, Send } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useGetApiSpacesSpaceIdRooms } from '@/api';
import { WindowManager, type WindowInstance } from '@/features/window-manager';
import { usePersistentToolbar } from '@/views/layouts/PersistentToolbar';
import { useWorkbenchPersistence } from '../hooks/useWorkbenchPersistence';
import { createWorkbenchRuntimeForSpace, openKind } from '../lib/persistence';
import { isWorkbenchWindowKind, WINDOW_INFO, WINDOW_KINDS, type WindowKind } from '../model/window';

const WindowContent = lazy(() =>
  import('./windows/WindowContent').then((module) => ({ default: module.WindowContent })),
);

function WorkbenchTools({ onOpen }: { onOpen: (kind: WindowKind) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolMode, setToolMode] = useState<'chat' | 'search'>('chat');
  const [chatDraft, setChatDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const toolButtonClass =
    'grid size-10 shrink-0 place-items-center text-text-muted transition-colors hover:text-text';

  return (
    <>
      <Link
        to="/"
        aria-label="返回空间列表"
        title="返回空间列表"
        className={`${toolButtonClass} bg-surface`}
      >
        <ArrowLeft className="icon-stroke size-5" aria-hidden="true" />
      </Link>
      <button
        type="button"
        aria-label="聊天"
        title="聊天"
        aria-pressed={toolMode === 'chat'}
        className={`${toolButtonClass} ${toolMode === 'chat' ? 'bg-accent text-accent-text' : 'bg-surface'}`}
        onClick={() => setToolMode('chat')}
      >
        <MessageSquare className="icon-stroke size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="搜索"
        title="搜索"
        aria-pressed={toolMode === 'search'}
        className={`${toolButtonClass} ${toolMode === 'search' ? 'bg-accent text-accent-text' : 'bg-surface'}`}
        onClick={() => setToolMode('search')}
      >
        <Search className="icon-stroke size-5" aria-hidden="true" />
      </button>
      {toolMode === 'chat' ? (
        <>
          <input
            aria-label="聊天输入"
            placeholder="输入消息"
            value={chatDraft}
            onChange={(event) => setChatDraft(event.target.value)}
            className="min-w-0 flex-1 bg-surface px-3 py-2 text-base text-text outline-none placeholder:text-text-muted"
          />
          <button
            type="button"
            aria-label="发送消息"
            title="发送消息"
            className={`${toolButtonClass} bg-surface`}
          >
            <Send className="icon-stroke size-5" aria-hidden="true" />
          </button>
        </>
      ) : (
        <input
          type="search"
          aria-label="搜索工作台"
          placeholder="搜索当前窗口"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="min-w-0 flex-1 bg-surface px-3 py-2 text-base text-text outline-none placeholder:text-text-muted"
        />
      )}
      <div className="relative shrink-0">
        <button
          type="button"
          aria-label="添加窗口"
          title="添加窗口"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className={`${toolButtonClass} bg-surface`}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Plus className="icon-stroke size-5" aria-hidden="true" />
        </button>
        {menuOpen ? (
          <div
            role="menu"
            aria-label="添加工作台窗口"
            className="absolute right-0 bottom-full mb-3 w-36 border border-border bg-surface p-1 shadow-lg"
          >
            {WINDOW_KINDS.map((kind) => (
              <button
                type="button"
                role="menuitem"
                key={kind}
                className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
                onClick={() => {
                  onOpen(kind);
                  setMenuOpen(false);
                }}
              >
                {WINDOW_INFO[kind].title}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

function useWorkbenchToolbar(onOpen: (kind: WindowKind) => void) {
  const toolbar = useMemo(() => <WorkbenchTools onOpen={onOpen} />, [onOpen]);
  usePersistentToolbar(toolbar, 'docked');
}

export function WorkbenchPage({ spaceId }: { spaceId: string }) {
  const [runtime] = useState(() => createWorkbenchRuntimeForSpace(spaceId));
  const [activeRoomId, setActiveRoomId] = useState<string>();
  const { manager, workspace } = runtime;
  const openWindow = useMemo(() => (kind: WindowKind) => openKind(workspace, kind), [workspace]);
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

  useWorkbenchToolbar(openWindow);
  useWorkbenchPersistence(spaceId, manager);

  function renderWindow(window: WindowInstance) {
    if (!isWorkbenchWindowKind(window.windowTypeId)) return null;
    return (
      <Suspense fallback={<div className="p-4 text-sm text-text-muted">加载中</div>}>
        <WindowContent kind={window.windowTypeId} spaceId={spaceId} activeRoomId={activeRoomId} />
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
    <div className="h-full min-h-0 overflow-hidden pb-15">
      <WindowManager
        store={manager}
        renderWindow={renderWindow}
        renderWindowHeaderAddon={renderWindowHeaderAddon}
      />
    </div>
  );
}
