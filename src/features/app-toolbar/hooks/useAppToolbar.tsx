import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppToolbarDefinition } from '../model/toolbar';

interface AppToolbarEntry {
  id: symbol;
  definition: AppToolbarDefinition;
}

interface AppToolbarContextValue {
  activeEntry: AppToolbarEntry | null;
  register: (entry: AppToolbarEntry) => void;
  unregister: (id: symbol) => void;
}

interface AppToolbarRegistrationContextValue {
  register: (entry: AppToolbarEntry) => void;
  unregister: (id: symbol) => void;
}

const AppToolbarRegistrationContext = createContext<AppToolbarRegistrationContextValue | null>(
  null,
);
const AppToolbarStateContext = createContext<AppToolbarEntry | null | undefined>(undefined);

export function AppToolbarProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<AppToolbarEntry[]>([]);
  const activeEntry = entries.at(-1) ?? null;
  const register = useCallback((entry: AppToolbarEntry) => {
    setEntries((current) => {
      const index = current.findIndex((item) => item.id === entry.id);
      if (index < 0) return [...current, entry];
      const next = [...current];
      next[index] = entry;
      return next;
    });
  }, []);
  const unregister = useCallback((id: symbol) => {
    setEntries((current) => current.filter((item) => item.id !== id));
  }, []);
  const registration = useMemo<AppToolbarRegistrationContextValue>(
    () => ({ register, unregister }),
    [register, unregister],
  );

  return (
    <AppToolbarRegistrationContext value={registration}>
      <AppToolbarStateContext value={activeEntry}>{children}</AppToolbarStateContext>
    </AppToolbarRegistrationContext>
  );
}

export function useAppToolbarContext(): AppToolbarContextValue {
  const registration = useContext(AppToolbarRegistrationContext);
  const activeEntry = useContext(AppToolbarStateContext);
  if (!registration || activeEntry === undefined) {
    throw new Error('AppToolbar must be used inside AppToolbarProvider');
  }
  return { activeEntry, ...registration };
}

export function useAppToolbar(definition: AppToolbarDefinition): void {
  const registration = useContext(AppToolbarRegistrationContext);
  if (!registration) throw new Error('AppToolbar must be used inside AppToolbarProvider');
  const { register, unregister } = registration;
  const idRef = useRef<symbol | null>(null);
  if (!idRef.current) idRef.current = Symbol('app-toolbar');
  const id = idRef.current;

  useEffect(() => {
    register({ id, definition });
  }, [definition, id, register]);

  useEffect(() => () => unregister(id), [id, unregister]);
}
