import { Link } from '@tanstack/react-router';
import { ArrowLeft, Paperclip, Plus, Send, Smile } from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
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

  return (
    <>
      <Link
        to="/"
        aria-label="返回空间列表"
        title="返回空间列表"
        className="grid size-10 shrink-0 place-items-center bg-surface-muted text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="icon-stroke size-5" aria-hidden="true" />
      </Link>
      <button
        type="button"
        aria-label="添加附件"
        title="添加附件"
        className="grid size-10 shrink-0 place-items-center bg-surface-muted text-text-muted transition-colors hover:text-text"
      >
        <Paperclip className="icon-stroke size-5" aria-hidden="true" />
      </button>
      <input
        aria-label="聊天输入"
        placeholder="输入消息"
        className="min-w-0 flex-1 bg-surface-muted px-3 py-2 text-base text-text outline-none placeholder:text-text-muted"
      />
      <button
        type="button"
        aria-label="选择表情"
        title="选择表情"
        className="grid size-10 shrink-0 place-items-center bg-surface-muted text-text-muted transition-colors hover:text-text"
      >
        <Smile className="icon-stroke size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="发送消息"
        title="发送消息"
        className="grid size-10 shrink-0 place-items-center bg-surface-muted text-text-muted transition-colors hover:text-text"
      >
        <Send className="icon-stroke size-5" aria-hidden="true" />
      </button>
      <div className="relative shrink-0">
        <button
          type="button"
          aria-label="添加窗口"
          title="添加窗口"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="grid size-10 place-items-center bg-surface-muted text-text-muted transition-colors hover:text-text"
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
  const { manager, workspace } = runtime;
  const openWindow = useMemo(() => (kind: WindowKind) => openKind(workspace, kind), [workspace]);

  useWorkbenchToolbar(openWindow);
  useWorkbenchPersistence(spaceId, manager);

  function renderWindow(window: WindowInstance) {
    if (!isWorkbenchWindowKind(window.windowTypeId)) return null;
    return (
      <Suspense fallback={<div className="p-4 text-sm text-text-muted">加载中</div>}>
        <WindowContent kind={window.windowTypeId} />
      </Suspense>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-hidden pb-15">
      <WindowManager store={manager} renderWindow={renderWindow} />
    </div>
  );
}
