import { ArrowLeft, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/classNames';
import { WINDOW_INFO, WINDOW_KINDS, type WindowKind } from '../model/window';

export function SpaceTopbar({
  windows,
  focusedWindowId,
  visibleWindowIds,
  onBack,
  onAddWindow,
  onFocusWindow,
}: {
  windows: ReadonlyArray<{ instanceId: string; title: string }>;
  focusedWindowId: string | null;
  visibleWindowIds: readonly string[];
  onBack: () => void;
  onAddWindow: (kind: WindowKind) => void;
  onFocusWindow: (instanceId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const visibleWindows = new Set(visibleWindowIds);

  useEffect(() => {
    if (!menuOpen) return;

    const closeFromOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const closeFromKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeFromOutside);
    document.addEventListener('keydown', closeFromKeyboard);
    return () => {
      document.removeEventListener('pointerdown', closeFromOutside);
      document.removeEventListener('keydown', closeFromKeyboard);
    };
  }, [menuOpen]);

  return (
    <div className="grid h-10 w-full grid-cols-[1fr_auto_1fr] items-center">
      <button
        type="button"
        aria-label="返回空间列表"
        title="返回空间列表"
        className="grid size-10 touch-manipulation place-items-center justify-self-start text-text transition-transform duration-150 hover:scale-110 active:scale-95"
        onClick={onBack}
      >
        <ArrowLeft className="size-4.5" strokeWidth={2.5} aria-hidden="true" />
      </button>

      <div className="flex items-center">
        {windows.length >= 3 ? (
          <div role="tablist" aria-label="窗口" className="flex items-center">
            {windows.map((window) => {
              const focused = window.instanceId === focusedWindowId;
              const visible = visibleWindows.has(window.instanceId);
              return (
                <button
                  key={window.instanceId}
                  type="button"
                  role="tab"
                  aria-label={window.title}
                  aria-selected={focused}
                  title={window.title}
                  className="group grid h-7 w-3 place-items-center"
                  onClick={() => onFocusWindow(window.instanceId)}
                >
                  <span
                    className={cn(
                      'h-2.5 w-0.5 transition-all duration-150 group-hover:h-4 group-hover:bg-text',
                      visible ? 'bg-text' : 'bg-border',
                    )}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div ref={menuRef} className="relative justify-self-end">
        <button
          type="button"
          aria-label="添加窗口"
          title="添加窗口"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="grid size-10 touch-manipulation place-items-center text-text transition-transform duration-150 hover:scale-110 active:scale-95"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Plus className="size-4.5" strokeWidth={2.5} aria-hidden="true" />
        </button>

        {menuOpen ? (
          <div
            role="menu"
            aria-label="新增窗口"
            className="absolute top-full right-0 mt-2 w-40 border border-border-subtle bg-surface p-1 shadow-lg"
          >
            {WINDOW_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
                onClick={() => {
                  onAddWindow(kind);
                  setMenuOpen(false);
                }}
              >
                {WINDOW_INFO[kind].title}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
