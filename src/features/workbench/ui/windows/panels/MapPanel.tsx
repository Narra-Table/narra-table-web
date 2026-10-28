import { useState } from 'react';
import { cn } from '@/lib/utils';

const MAP_COLS = 8;
const MAP_ROWS = 6;

export function MapPanel() {
  const [pins, setPins] = useState<Record<string, string>>({});
  const [label, setLabel] = useState('甲');
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-3">
      <div className="flex items-center gap-2">
        <label className="text-xs text-text-muted" htmlFor="map-pin">
          标记
        </label>
        <input
          id="map-pin"
          value={label}
          onChange={(event) => setLabel(event.target.value.slice(0, 2))}
          className="w-16 rounded-control border border-border bg-app-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent"
        />
        <button
          type="button"
          className="ml-auto text-xs font-medium text-text-muted"
          onClick={() => setPins({})}
        >
          清空
        </button>
      </div>
      <div
        className="grid min-h-0 flex-1 grid-cols-8 gap-1"
        style={{ gridTemplateRows: `repeat(${MAP_ROWS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: MAP_COLS * MAP_ROWS }, (_, index) => {
          const key = String(index);
          const mark = pins[key];
          return (
            <button
              key={key}
              type="button"
              aria-label={mark ? `格子 ${index + 1}，${mark}` : `格子 ${index + 1}`}
              onClick={() =>
                setPins((current) => {
                  const next = { ...current };
                  if (next[key]) delete next[key];
                  else if (label.trim()) next[key] = label.trim();
                  return next;
                })
              }
              className={cn(
                'rounded-thumb border border-border-subtle text-xs font-semibold',
                mark ? 'bg-accent text-accent-text' : 'bg-app-bg text-text-muted',
              )}
            >
              {mark}
            </button>
          );
        })}
      </div>
    </div>
  );
}
