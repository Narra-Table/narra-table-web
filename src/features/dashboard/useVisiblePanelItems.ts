import { useEffect, useRef, useState } from 'react';

export function useVisiblePanelItems(itemCount: number) {
  const listRef = useRef<HTMLUListElement>(null);
  const [listEl, setListEl] = useState<HTMLUListElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(itemCount);

  useEffect(() => {
    if (listRef.current && listRef.current !== listEl) setListEl(listRef.current);
  }, [listEl]);

  useEffect(() => {
    if (!listEl) return;

    const updateVisibleCount = () => {
      const itemHeight = 40;
      const gap = 12;
      const nextVisibleCount = Math.floor((listEl.clientHeight + gap) / (itemHeight + gap));
      setVisibleCount(Math.min(itemCount, Math.max(1, nextVisibleCount)));
    };

    updateVisibleCount();
    const resizeObserver = new ResizeObserver(updateVisibleCount);
    resizeObserver.observe(listEl);

    return () => resizeObserver.disconnect();
  }, [itemCount, listEl]);

  return { listRef, visibleCount };
}
