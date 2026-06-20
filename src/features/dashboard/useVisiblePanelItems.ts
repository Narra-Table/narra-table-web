import { useEffect, useRef, useState } from 'react';

export function useVisiblePanelItems(itemCount: number) {
  const listRef = useRef<HTMLUListElement>(null);
  const [visibleCount, setVisibleCount] = useState(itemCount);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const updateVisibleCount = () => {
      const itemHeight = 40;
      const gap = 12;
      const nextVisibleCount = Math.floor((list.clientHeight + gap) / (itemHeight + gap));
      setVisibleCount(Math.min(itemCount, Math.max(1, nextVisibleCount)));
    };

    updateVisibleCount();
    const resizeObserver = new ResizeObserver(updateVisibleCount);
    resizeObserver.observe(list);

    return () => resizeObserver.disconnect();
  }, [itemCount]);

  return { listRef, visibleCount };
}
