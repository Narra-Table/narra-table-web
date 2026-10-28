import { useState } from 'react';
import { firstLine, messageExcerpt } from '../../model/text';
import type { RoomMessage } from '../../model/types';

export function PinStrip({
  pins,
  onJump,
}: {
  pins: RoomMessage[];
  onJump: (messageId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (pins.length === 0) return null;
  const visible = expanded ? pins : pins.slice(0, 3);
  const hidden = pins.length - 3;
  return (
    <div className="border-b border-border-subtle bg-surface px-4 py-2">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
        {visible.map((pin) => (
          <button
            key={pin.messageId}
            type="button"
            className="truncate text-left text-sm text-text hover:text-accent"
            onClick={() => pin.messageId && onJump(pin.messageId)}
          >
            {firstLine(messageExcerpt(pin)) || '置顶'}
          </button>
        ))}
        {hidden > 0 ? (
          <button
            type="button"
            className="text-left text-xs font-medium text-text-muted"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? '收起' : `还有 ${hidden} 条`}
          </button>
        ) : null}
      </div>
    </div>
  );
}
