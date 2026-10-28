import { useState } from 'react';
import type { SceneAnchor } from '../model/types';

export function SceneMenu({
  scenes,
  activeId,
  searching,
  note,
  onSelect,
}: {
  scenes: SceneAnchor[];
  activeId?: string;
  searching: boolean;
  note: string | null;
  onSelect: (sceneId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border-subtle bg-app-bg px-4 py-2">
      <div className="mx-auto flex w-full max-w-2xl items-start justify-between gap-3">
        <div className="relative">
          <button
            type="button"
            className="rounded-control px-3 py-1.5 text-sm font-medium text-text"
            onClick={() => setOpen((value) => !value)}
          >
            场景
          </button>
          {open ? (
            <div className="absolute left-0 z-10 mt-1 flex max-h-64 w-56 flex-col overflow-y-auto rounded-card border border-border-subtle bg-surface p-1">
              {scenes.length === 0 ? (
                <p className="px-3 py-2 text-sm text-text-muted">还没有幕标</p>
              ) : null}
              {scenes.map((scene) => (
                <button
                  key={scene.id}
                  type="button"
                  className="rounded-control px-3 py-1.5 text-left text-sm text-text hover:bg-surface-muted data-selected:text-accent"
                  data-selected={scene.id === activeId}
                  onClick={() => {
                    setOpen(false);
                    onSelect(scene.id);
                  }}
                >
                  {scene.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {searching ? <p className="py-1.5 text-xs text-text-muted">正在查找</p> : null}
        {!searching && note ? <p className="py-1.5 text-xs text-danger">{note}</p> : null}
      </div>
    </div>
  );
}
