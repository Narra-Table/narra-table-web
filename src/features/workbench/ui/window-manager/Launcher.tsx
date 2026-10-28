import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { selectTaskbarGroups } from '../../model/window-manager/selectors';
import { useWorkbenchContext } from './context';
import type { RegisteredWindow } from './types';
import { useWorkbenchStore } from './useWorkbench';

export interface LauncherRequest {
  /** Set by the `+` button to insert the chosen window into this column. */
  containerId?: string;
}

export interface LauncherApi {
  open: (request?: LauncherRequest) => void;
  close: () => void;
}

const LauncherContext = createContext<LauncherApi>({
  open: () => {},
  close: () => {},
});

export function useLauncher(): LauncherApi {
  return useContext(LauncherContext);
}

export function WorkbenchLauncherProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<LauncherRequest | null>(null);
  const open = useCallback((next: LauncherRequest = {}) => setRequest(next), []);
  const close = useCallback(() => setRequest(null), []);
  const api = useMemo<LauncherApi>(() => ({ open, close }), [open, close]);

  return (
    <LauncherContext.Provider value={api}>
      {children}
      <WorkbenchLauncherOverlay request={request} onClose={close} />
    </LauncherContext.Provider>
  );
}

function matches(query: string, values: Array<string | undefined>): boolean {
  if (!query) return true;
  const haystack = values.filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function WorkbenchLauncherOverlay({
  request,
  onClose,
}: {
  request: LauncherRequest | null;
  onClose: () => void;
}) {
  const { store, registry, messages } = useWorkbenchContext();
  const state = useWorkbenchStore(store);
  const [tab, setTab] = useState<'apps' | 'windows'>('apps');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const apps = useMemo(
    () => registry.listWindows().filter((window) => window.launcher !== false),
    [registry],
  );
  const windows = useMemo(
    () =>
      selectTaskbarGroups(state).flatMap((group) =>
        group.items.map((item) => {
          const window = state.windows[item.instanceId];
          const descriptor = window
            ? registry.getWindow(window.appId, window.windowTypeId)
            : undefined;
          return {
            instanceId: item.instanceId,
            title: item.title,
            appName: descriptor?.appName,
            containerId: group.containerId,
            state: group.state,
          };
        }),
      ),
    [registry, state],
  );

  const filteredApps = apps.filter((window) =>
    matches(query, [window.title, window.appName, window.description]),
  );
  const filteredWindows = windows.filter((window) =>
    matches(query, [window.title, window.appName]),
  );
  const items = tab === 'apps' ? filteredApps : filteredWindows;

  useEffect(() => {
    if (!request) return;
    setTab('apps');
    setQuery('');
    setSelected(0);
    inputRef.current?.focus();
  }, [request]);

  useEffect(() => {
    setSelected(0);
  }, [tab, query]);

  if (!request) return null;

  const openApp = (window: RegisteredWindow) => {
    store.actions.open({
      appId: window.appId,
      windowTypeId: window.windowTypeId,
      title: window.title,
      ...(window.icon ? { icon: window.icon } : {}),
      width: window.defaultWidth,
      display: window.defaultDisplay,
      chrome: window.chrome,
      floating: window.floating,
      singleton: window.singleton,
      ...(request.containerId ? { intoContainerId: request.containerId } : {}),
    });
    onClose();
  };

  const focusWindow = (instanceId: string) => {
    store.actions.focus(instanceId);
    onClose();
  };

  const choose = (index: number) => {
    if (tab === 'apps') {
      const window = filteredApps[index];
      if (window) openApp(window);
      return;
    }
    const window = filteredWindows[index];
    if (window) focusWindow(window.instanceId);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected((current) => Math.min(items.length - 1, current + 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected((current) => Math.max(0, current - 1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      choose(selected);
      return;
    }
    if (event.key === 'Tab') {
      const focusables = [
        ...event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="wm-launcher-layer"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="wm-launcher"
        role="dialog"
        aria-modal="true"
        aria-label={messages.launcher}
        onKeyDown={onKeyDown}
      >
        <header className="wm-launcher-header">
          <div className="wm-launcher-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'apps'}
              className="wm-launcher-tab"
              onClick={() => setTab('apps')}
            >
              {messages.launcherApps}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'windows'}
              className="wm-launcher-tab"
              onClick={() => setTab('windows')}
            >
              {messages.launcherWindows}
            </button>
          </div>
          {request.containerId ? (
            <span className="wm-launcher-hint">{messages.launcherAddToContainer}</span>
          ) : null}
          <button
            type="button"
            className="wm-icon-button"
            aria-label={messages.close}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <input
          ref={inputRef}
          className="wm-launcher-search"
          placeholder={messages.launcherSearch}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="wm-launcher-list" role="listbox">
          {items.length === 0 ? (
            <p className="wm-launcher-empty">{messages.launcherEmpty}</p>
          ) : tab === 'apps' ? (
            filteredApps.map((window, index) => (
              <button
                type="button"
                key={`${window.appId}/${window.windowTypeId}`}
                role="option"
                aria-selected={index === selected}
                className="wm-launcher-item"
                onMouseEnter={() => setSelected(index)}
                onClick={() => openApp(window)}
              >
                <span className="wm-launcher-item-title">{window.title}</span>
                <span className="wm-launcher-item-meta">
                  {window.appName ?? window.appId}
                  {window.description ? ` · ${window.description}` : ''}
                </span>
              </button>
            ))
          ) : (
            filteredWindows.map((window, index) => (
              <div
                key={window.instanceId}
                className="wm-launcher-window"
                data-selected={index === selected}
                onMouseEnter={() => setSelected(index)}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={index === selected}
                  className="wm-launcher-item"
                  onClick={() => focusWindow(window.instanceId)}
                >
                  <span className="wm-launcher-item-title">{window.title}</span>
                  <span className="wm-launcher-item-meta">
                    {window.appName ?? window.instanceId} · {window.state}
                  </span>
                </button>
                <button
                  type="button"
                  className="wm-icon-button"
                  aria-label={`${messages.close}: ${window.title}`}
                  onClick={() => store.actions.close(window.instanceId)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
