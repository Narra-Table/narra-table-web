import type { ReactNode } from 'react';
import { selectTaskbarGroups } from '../core/selectors';
import { useWorkbenchContext, useWorkbenchState } from './context';
import { WindowIcon } from './WindowFrame';

export function WorkbenchTaskbar({
  leading,
  onOpenLauncher,
}: {
  leading?: ReactNode;
  onOpenLauncher?: () => void;
}) {
  const { store, registry, messages } = useWorkbenchContext();
  const state = useWorkbenchState();
  const groups = selectTaskbarGroups(state);

  return (
    <footer className="wm-taskbar" aria-label={messages.taskbarLabel}>
      {onOpenLauncher ? (
        <button type="button" className="wm-taskbar-apps" onClick={onOpenLauncher}>
          {messages.launcher}
        </button>
      ) : null}
      {leading ? <div className="wm-taskbar-leading">{leading}</div> : null}
      <div className="wm-taskbar-groups">
        {groups.map((group) => (
          <div
            className="wm-taskbar-group"
            key={group.containerId}
            data-kind={group.kind}
            data-state={group.state}
          >
            {group.items.map((item) => {
              const window = state.windows[item.instanceId];
              if (!window) return null;
              return (
                <button
                  type="button"
                  key={item.instanceId}
                  className="wm-taskbar-item"
                  data-focused={item.focused}
                  title={item.title}
                  aria-label={item.title}
                  onClick={() => store.actions.focus(item.instanceId)}
                >
                  <WindowIcon
                    window={window}
                    descriptor={registry.getWindow(window.appId, window.windowTypeId)}
                    className="wm-window-icon-small"
                  />
                  <span className="wm-taskbar-title">{item.title}</span>
                  {item.attention ? (
                    <span
                      className={`wm-attention wm-attention-${item.attention.level}`}
                      aria-label={`attention: ${item.attention.level}`}
                    >
                      {item.attention.level === 'urgent' ? '!' : '•'}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </footer>
  );
}
