import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { WindowManager, type WindowInstance } from '@/features/window-manager';
import { useWorkbenchPersistence } from '../hooks/useWorkbenchPersistence';
import { createWorkbenchRuntimeForSpace, openKind } from '../lib/persistence';
import { isWorkbenchWindowKind, WINDOW_INFO, WINDOW_KINDS, type WindowKind } from '../model/window';

const WindowContent = lazy(() =>
  import('./windows/WindowContent').then((module) => ({ default: module.WindowContent })),
);

function WorkbenchToolbar({ onOpen }: { onOpen: (kind: WindowKind) => void }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Link
        to="/"
        aria-label="返回空间列表"
        title="返回空间列表"
        className="grid size-8 shrink-0 place-items-center rounded-control text-text-muted hover:bg-surface-muted hover:text-text"
      >
        <ArrowLeft className="icon-stroke size-4" />
      </Link>
      <h1 className="min-w-24 truncate text-sm font-semibold text-text">工作台</h1>
      <div className="scroll-subtle-native-hidden flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {WINDOW_KINDS.map((kind) => (
          <button
            type="button"
            key={kind}
            className="shrink-0 rounded-control px-3 py-1.5 text-xs text-text-muted hover:bg-surface-muted hover:text-text"
            onClick={() => onOpen(kind)}
          >
            {WINDOW_INFO[kind].title}
          </button>
        ))}
      </div>
    </div>
  );
}

export function WorkbenchPage({ spaceId }: { spaceId: string }) {
  const [runtime] = useState(() => createWorkbenchRuntimeForSpace(spaceId));
  const { manager, workspace } = runtime;

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
    <div className="h-full min-h-0 overflow-hidden">
      <WindowManager
        store={manager}
        toolbar={<WorkbenchToolbar onOpen={(kind) => openKind(workspace, kind)} />}
        renderWindow={renderWindow}
      />
    </div>
  );
}
