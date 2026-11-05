import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  register: (entry: AppToolbarEntry) => () => void;
}

const AppToolbarContext = createContext<AppToolbarContextValue | null>(null);

export function AppToolbarProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<AppToolbarEntry[]>([]);
  const activeEntry = entries.at(-1) ?? null;
  const register = useCallback((entry: AppToolbarEntry) => {
    setEntries((current) => [...current.filter((item) => item.id !== entry.id), entry]);
    return () => setEntries((current) => current.filter((item) => item.id !== entry.id));
  }, []);
  const value = useMemo<AppToolbarContextValue>(
    () => ({ activeEntry, register }),
    [activeEntry, register],
  );

  return <AppToolbarContext value={value}>{children}</AppToolbarContext>;
}

export function useAppToolbarContext(): AppToolbarContextValue {
  const context = useContext(AppToolbarContext);
  if (!context) throw new Error('AppToolbar must be used inside AppToolbarProvider');
  return context;
}

export function useAppToolbar(definition: AppToolbarDefinition): void {
  const { register } = useAppToolbarContext();

  useEffect(() => {
    const id = Symbol('app-toolbar');
    return register({ id, definition });
  }, [definition, register]);
}
