import { MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function SpaceQuickActionsMenu({
  pinned,
  onTogglePin,
}: {
  pinned: boolean;
  onTogglePin: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={menuRef}
      className="absolute right-3 top-3 z-20"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="更多"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`rounded-thumb border border-border-subtle bg-surface/85 p-1.5 text-text-muted backdrop-blur-sm transition hover:text-text focus-visible:opacity-100 ${
          open ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
        }`}
      >
        <MoreHorizontal className="icon-stroke size-4" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-9 z-30 w-36 rounded-overlay border border-border-subtle bg-surface p-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full rounded-control px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
            onClick={() => {
              setOpen(false);
              onTogglePin();
            }}
          >
            {pinned ? '取消置顶' : '置顶空间'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
