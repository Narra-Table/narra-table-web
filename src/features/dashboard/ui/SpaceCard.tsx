import { useNavigate } from '@tanstack/react-router';
import { MoreHorizontal, Pin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useGetApiSpacesSpaceIdRooms } from '@/api';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { primeWorkbenchRoom } from '@/features/workbench';
import type { SpaceListItem } from '../model/types';

function picsum(seed: string, size = 40) {
  return `https://picsum.photos/seed/${seed}/${size}`;
}

export function SpaceCard({
  space,
  pinned,
  onTogglePin,
  onEdit,
  onArchive,
}: {
  space: SpaceListItem;
  pinned: boolean;
  onTogglePin: () => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const memberCount = space.memberCount ?? 0;
  const { data: rooms = [] } = useGetApiSpacesSpaceIdRooms(space.spaceId, {
    query: { select: (response) => response.data.rooms ?? [] },
  });

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  function enter(roomId?: string) {
    if (!space.spaceId) return;
    setMenuOpen(false);
    // 房间不回 URL：先写入工作台偏好，再由工作台读取。
    if (roomId) primeWorkbenchRoom(space.spaceId, roomId);
    void navigate({ to: '/spaces/$spaceId', params: { spaceId: space.spaceId } });
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => enter()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target === event.currentTarget) {
          event.preventDefault();
          enter();
        }
      }}
      className="group flex min-h-34.5 cursor-pointer rounded-home-card border border-border-subtle bg-surface transition-colors duration-200 hover:bg-surface-muted"
    >
      {/* Cover */}
      <div className="relative w-34.5 shrink-0 self-stretch overflow-hidden bg-surface-muted">
        <img
          src={space.avatar ?? picsum(space.spaceId ?? 'space', 200)}
          alt={space.name ?? '空间封面'}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-3 py-2">
        {/* Title row */}
        <div className="flex items-center gap-1.5">
          {pinned ? <Pin className="size-3.5 shrink-0 text-accent" aria-label="已置顶" /> : null}
          <span className="min-w-0 truncate text-lg font-semibold text-text">
            {space.name ?? '未命名空间'}
          </span>
          <div className="relative ml-auto shrink-0" ref={menuRef}>
            <button
              type="button"
              aria-label="更多"
              aria-expanded={menuOpen}
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((open) => !open);
              }}
              className={`rounded-thumb p-0.5 text-text-muted transition-opacity hover:text-text focus-visible:opacity-100 ${
                menuOpen ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
              }`}
            >
              <MoreHorizontal className="size-4" />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-7 z-20 w-44 rounded-overlay border border-border-subtle bg-surface p-1"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full rounded-control px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                >
                  编辑空间信息
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full rounded-control px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
                  onClick={() => {
                    setMenuOpen(false);
                    onTogglePin();
                  }}
                >
                  {pinned ? '取消置顶' : '置顶空间'}
                </button>
                <div className="my-1 border-t border-border-subtle" />
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full rounded-control px-3 py-2 text-left text-sm text-danger hover:bg-surface-muted"
                  onClick={() => {
                    setMenuOpen(false);
                    onArchive();
                  }}
                >
                  归档空间
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Description */}
        <p className="line-clamp-3 text-sm leading-snug text-text-muted">
          {space.description || '暂无简介'}
        </p>

        {rooms.length > 0 ? (
          <div className="mt-1 flex min-w-0 flex-wrap gap-1.5">
            {rooms.slice(0, 3).map((room) => (
              <button
                key={room.roomId}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  enter(room.roomId);
                }}
                className="max-w-full truncate rounded-control bg-surface-muted px-2 py-1 text-xs text-text-muted transition-colors hover:text-accent"
              >
                {room.name}
              </button>
            ))}
            {rooms.length > 3 ? (
              <span className="px-1 py-1 text-xs text-text-muted">+{rooms.length - 3}</span>
            ) : null}
          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <div className="flex -space-x-1.5">
            {Array.from({ length: Math.min(4, memberCount) }, (_, i) => (
              <Avatar key={i} className="size-6 ring-2 ring-surface">
                <AvatarImage src={picsum(`${space.spaceId}_m${i}`, 24)} alt="" />
              </Avatar>
            ))}
            {memberCount > 4 && (
              <div className="flex size-6 items-center justify-center rounded-full bg-surface-muted text-2xs font-medium text-text-muted ring-2 ring-surface">
                +{memberCount - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-text-muted">{memberCount} 人</span>
        </div>
      </div>
    </article>
  );
}
