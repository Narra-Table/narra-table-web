/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createSequentialIdFactory, createWindowManagerStore } from '../model/store';
import { MobileWindowManager } from './MobileWindowManager';
import { WindowManager } from './WindowManager';

afterEach(cleanup);

describe('WindowManager', () => {
  it('renders and closes managed windows', () => {
    const store = createWindowManagerStore({ createId: createSequentialIdFactory() });
    store.actions.open({ appId: 'app', windowTypeId: 'chat', title: 'Chat' });

    render(
      <WindowManager
        store={store}
        toolbar={<span>Toolbar</span>}
        renderWindow={(window) => <div>{window.windowTypeId} body</div>}
        renderWindowHeaderAddon={() => <span>Room switcher</span>}
      />,
    );

    expect(screen.getByText('Toolbar')).toBeDefined();
    expect(screen.getByText('chat body')).toBeDefined();
    expect(screen.getByText('Room switcher')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: '关闭Chat' }));
    expect(screen.getByText('工作台是空的，请从顶部打开一个窗口。')).toBeDefined();
  });

  it('switches mobile windows without unmounting their content', () => {
    const store = createWindowManagerStore({ createId: createSequentialIdFactory() });
    store.actions.open({ appId: 'app', windowTypeId: 'chat', title: 'Chat' });
    store.actions.open({ appId: 'app', windowTypeId: 'map', title: 'Map' });

    const view = render(
      <MobileWindowManager
        state={store.getState()}
        renderWindow={(window) => <div>{window.windowTypeId} body</div>}
        onFocus={(instanceId) => store.actions.focus(instanceId)}
        onClose={(instanceId) => store.actions.close(instanceId)}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Map' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('tab', { name: 'Chat' }));
    view.rerender(
      <MobileWindowManager
        state={store.getState()}
        renderWindow={(window) => <div>{window.windowTypeId} body</div>}
        onFocus={(instanceId) => store.actions.focus(instanceId)}
        onClose={(instanceId) => store.actions.close(instanceId)}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Chat' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('chat body')).toBeDefined();
    expect(screen.getByText('map body')).toBeDefined();
  });
});
