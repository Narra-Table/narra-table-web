import { Menu, UnfoldHorizontal, X, type LucideIcon } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './utils';

function clampMenu(left: number, top: number, menu: DOMRect): { top: number; left: number } {
  return {
    left: Math.max(8, Math.min(left, window.innerWidth - menu.width - 8)),
    top: Math.max(8, Math.min(top, window.innerHeight - menu.height - 8)),
  };
}

/** Small popover menu used by column and floating chrome. */
export function WorkbenchMenu({
  label,
  children,
  className,
  buttonClassName,
  trigger,
  align = 'end',
}: {
  label: string;
  children: ReactNode;
  className?: string;
  buttonClassName?: string;
  /** Replaces the default ellipsis. Traffic lights pass their own glyph. */
  trigger?: ReactNode;
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const anchor = rootRef.current?.getBoundingClientRect();
      const menu = listRef.current?.getBoundingClientRect();
      if (!anchor || !menu) return;
      const left = align === 'end' ? anchor.right - menu.width : anchor.left;
      let top = anchor.bottom + 6;
      if (top + menu.height > window.innerHeight - 8) {
        top = anchor.top - menu.height - 6;
      }
      setPlace(clampMenu(left, top, menu));
    };
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [open, align, children]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={cn('wm-menu', className)} data-align={align} ref={rootRef}>
      <button
        type="button"
        className={buttonClassName ?? 'wm-text-button'}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger ?? '⋯'}
      </button>
      {open
        ? createPortal(
            <div
              ref={listRef}
              className="wm-menu-list"
              role="menu"
              style={{
                top: place?.top ?? 0,
                left: place?.left ?? 0,
                visibility: place ? 'visible' : 'hidden',
              }}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('button')) setOpen(false);
              }}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/** Same menu surface as the chrome button, opened at the pointer. */
export function WorkbenchContextMenu({
  x,
  y,
  onClose,
  children,
}: {
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const menu = listRef.current?.getBoundingClientRect();
    if (!menu) return;
    setPlace(clampMenu(x, y, menu));
  }, [x, y, children]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (listRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={listRef}
      className="wm-menu-list"
      role="menu"
      style={{
        top: place?.top ?? y,
        left: place?.left ?? x,
        visibility: place ? 'visible' : 'hidden',
      }}
      onContextMenu={(event) => event.preventDefault()}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('button')) onClose();
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function WorkbenchMenuItem({
  onSelect,
  disabled = false,
  children,
}: {
  onSelect: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className="wm-menu-item"
      disabled={disabled}
      onClick={onSelect}
    >
      {children}
    </button>
  );
}

function LightGlyph({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="icon-stroke wm-light-icon" aria-hidden="true" />;
}

/**
 * Yellow, green, red. Red sits at the outer edge.
 * Labels are text, not color: 菜单 / 宽度 / 关闭.
 */
export function TrafficLights({
  menu,
  onWidth,
  widthDisabled = false,
  widthPressed,
  onClose,
}: {
  menu: ReactNode;
  onWidth?: () => void;
  widthDisabled?: boolean;
  widthPressed?: boolean;
  onClose: () => void;
}) {
  return (
    <div className="wm-traffic-lights">
      <WorkbenchMenu
        label="菜单"
        buttonClassName="wm-light wm-light-menu"
        trigger={<LightGlyph icon={Menu} />}
      >
        {menu}
      </WorkbenchMenu>
      <button
        type="button"
        className="wm-light wm-light-width"
        aria-label="宽度"
        title="宽度"
        disabled={widthDisabled}
        aria-pressed={widthPressed}
        onClick={widthDisabled ? undefined : onWidth}
      >
        <LightGlyph icon={UnfoldHorizontal} />
      </button>
      <button
        type="button"
        className="wm-light wm-light-close"
        aria-label="关闭"
        title="关闭"
        onClick={onClose}
      >
        <LightGlyph icon={X} />
      </button>
    </div>
  );
}
