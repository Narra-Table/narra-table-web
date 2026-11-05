import { useEffect, useState, type RefObject } from 'react';
import { useWorkbenchContext, useWorkbenchState } from './context';

const SCROLL_SEGMENTS = 36;

function ScrollIndicator({ stripRef }: { stripRef: RefObject<HTMLElement | null> }) {
  const state = useWorkbenchState();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) {
      setVisible(false);
      return;
    }
    const update = () => {
      const max = strip.scrollWidth - strip.clientWidth;
      setVisible(max > 0);
      setProgress(max > 0 ? strip.scrollLeft / max : 0);
    };
    update();
    strip.addEventListener('scroll', update);
    return () => strip.removeEventListener('scroll', update);
  }, [stripRef, state]);

  if (!visible) return null;

  const active = Math.round(progress * (SCROLL_SEGMENTS - 1));

  return (
    <div className="wm-scroll-progress" aria-hidden="true">
      {Array.from({ length: SCROLL_SEGMENTS }, (_, index) => (
        <span
          key={index}
          className={index === active ? 'wm-scroll-progress-active' : undefined}
        />
      ))}
    </div>
  );
}

export function WorkbenchTaskbar({
  stripRef,
  onOpenLauncher,
}: {
  stripRef: RefObject<HTMLElement | null>;
  onOpenLauncher?: () => void;
}) {
  const { messages } = useWorkbenchContext();

  return (
    <footer className="wm-taskbar" aria-label={messages.taskbarLabel}>
      {onOpenLauncher ? (
        <button type="button" className="wm-taskbar-apps" onClick={onOpenLauncher}>
          {messages.launcher}
        </button>
      ) : null}
      <ScrollIndicator stripRef={stripRef} />
    </footer>
  );
}
