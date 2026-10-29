import { useRef, useState, type PointerEvent } from 'react';

export function usePressReveal(): {
  revealed: boolean;
  bind: {
    onPointerDown: (event: PointerEvent) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
    onPointerLeave: () => void;
  };
} {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  return {
    revealed,
    bind: {
      onPointerDown: (event) => {
        if (event.pointerType === 'mouse') return;
        clear();
        timer.current = window.setTimeout(() => setRevealed(true), 500);
      },
      onPointerUp: clear,
      onPointerCancel: clear,
      onPointerLeave: clear,
    },
  };
}
