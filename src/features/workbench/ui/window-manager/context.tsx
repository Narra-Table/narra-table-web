import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { clampColumnWidth } from '../../model/window-manager/geometry';
import type { WorkbenchStore } from '../../model/window-manager/store';
import type { WorkspaceState } from '../../model/window-manager/types';
import {
  DEFAULT_MESSAGES,
  DEFAULT_WORKBENCH_CONFIG,
  type AppRegistry,
  type IconRenderer,
  type OpenWindow,
  type OpenWindowOptions,
  type RegisteredWindow,
  type WindowRenderer,
  type WorkbenchConfig,
  type WorkbenchMessages,
} from './types';
import { useWorkbenchStore } from './useWorkbench';

export interface WorkbenchContextValue {
  store: WorkbenchStore;
  registry: AppRegistry;
  renderWindow: WindowRenderer;
  renderIcon?: IconRenderer;
  messages: WorkbenchMessages;
  config: WorkbenchConfig;
}

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);

export interface WorkbenchProviderProps {
  store: WorkbenchStore;
  registry: AppRegistry;
  renderWindow: WindowRenderer;
  renderIcon?: IconRenderer;
  messages?: Partial<WorkbenchMessages>;
  config?: Partial<WorkbenchConfig>;
  children: ReactNode;
}

export function WorkbenchProvider({
  store,
  registry,
  renderWindow,
  renderIcon,
  messages,
  config,
  children,
}: WorkbenchProviderProps) {
  const value = useMemo<WorkbenchContextValue>(
    () => ({
      store,
      registry,
      renderWindow,
      ...(renderIcon ? { renderIcon } : {}),
      messages: { ...DEFAULT_MESSAGES, ...messages },
      config: {
        ...DEFAULT_WORKBENCH_CONFIG,
        ...config,
        widthPresets: config?.widthPresets ?? DEFAULT_WORKBENCH_CONFIG.widthPresets,
        floatingBox: config?.floatingBox ?? DEFAULT_WORKBENCH_CONFIG.floatingBox,
      },
    }),
    [store, registry, renderWindow, renderIcon, messages, config],
  );

  return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>;
}

export function useWorkbenchContext(): WorkbenchContextValue {
  const context = useContext(WorkbenchContext);
  if (!context) {
    throw new Error('workbench hooks must be used inside <WorkbenchProvider>');
  }
  return context;
}

export function useWorkbenchState(): WorkspaceState {
  const { store } = useWorkbenchContext();
  return useWorkbenchStore(store);
}

/** Imperative API for host chrome such as open buttons and menus. */
export function useWorkbenchApi(): WorkbenchStore['actions'] {
  const { store } = useWorkbenchContext();
  return store.actions;
}

export function useWindowType(appId: string, windowTypeId: string): RegisteredWindow | undefined {
  const { registry } = useWorkbenchContext();
  return registry.getWindow(appId, windowTypeId);
}

/**
 * Open a registered window type. App defaults are resolved here; host chrome
 * only needs to pass an app id, a window type id and optional overrides.
 */
export function useOpenWindow(): OpenWindow {
  const { store, registry, config } = useWorkbenchContext();
  return useCallback<OpenWindow>(
    (appId, windowTypeId, options: OpenWindowOptions = {}) => {
      const descriptor = registry.getWindow(appId, windowTypeId);
      if (!descriptor) return null;

      return store.actions.open({
        appId,
        windowTypeId,
        title: descriptor.title,
        ...(descriptor.icon ? { icon: descriptor.icon } : {}),
        chrome: options.chrome ?? descriptor.chrome,
        width: clampColumnWidth(options.width ?? descriptor.defaultWidth ?? config.defaultWidth),
        display: options.display ?? descriptor.defaultDisplay,
        floating: options.floating ?? descriptor.floating,
        floatingBox: options.floatingBox ?? config.floatingBox,
        singleton: options.singleton ?? descriptor.singleton,
        ...(options.state === undefined ? {} : { state: options.state }),
        ...(options.intoContainerId ? { intoContainerId: options.intoContainerId } : {}),
        ...(options.index === undefined ? {} : { index: options.index }),
      });
    },
    [store, registry, config],
  );
}

/** Convenience hook for hosts that need state, actions and registry together. */
export function useWorkbench() {
  const context = useWorkbenchContext();
  const state = useWorkbenchStore(context.store);
  return {
    ...context,
    state,
    actions: context.store.actions,
  };
}
