import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DragPayload } from './drag';

export interface WorkbenchDragApi {
  payload: DragPayload | null;
  start: (payload: DragPayload) => void;
  end: () => void;
}

const DragContext = createContext<WorkbenchDragApi>({
  payload: null,
  start: () => {},
  end: () => {},
});

export function useWorkbenchDrag(): WorkbenchDragApi {
  return useContext(DragContext);
}

export function WorkbenchDragProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<DragPayload | null>(null);
  const start = useCallback((next: DragPayload) => setPayload(next), []);
  const end = useCallback(() => setPayload(null), []);
  // The dragged node can unmount before its own dragend, which used to leave
  // the stack drop hint mounted.
  useEffect(() => {
    if (!payload) return;
    const clear = () => setPayload(null);
    document.addEventListener('dragend', clear);
    return () => document.removeEventListener('dragend', clear);
  }, [payload]);
  const api = useMemo<WorkbenchDragApi>(() => ({ payload, start, end }), [payload, start, end]);
  return <DragContext.Provider value={api}>{children}</DragContext.Provider>;
}
