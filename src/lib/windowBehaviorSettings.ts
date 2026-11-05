export const WINDOW_EDGE_AUTO_SCROLL_STORAGE_KEY = 'narra-window-edge-auto-scroll';

const listeners = new Set<() => void>();

export function getWindowEdgeAutoScroll(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(WINDOW_EDGE_AUTO_SCROLL_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveWindowEdgeAutoScroll(enabled: boolean): void {
  try {
    localStorage.setItem(WINDOW_EDGE_AUTO_SCROLL_STORAGE_KEY, String(enabled));
  } catch {
    // 隐私模式下仅通知当前页面。
  }
  listeners.forEach((listener) => listener());
}

export function subscribeWindowEdgeAutoScroll(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === WINDOW_EDGE_AUTO_SCROLL_STORAGE_KEY) listener();
  };
  listeners.add(listener);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}
