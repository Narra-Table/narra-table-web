/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createSequentialIdFactory, createWindowManagerStore } from '../model/store';
import { WindowManager } from './WindowManager';

describe('WindowManager', () => {
  it('renders and closes managed windows', () => {
    const store = createWindowManagerStore({ createId: createSequentialIdFactory() });
    store.actions.open({ appId: 'app', windowTypeId: 'chat', title: 'Chat' });

    render(
      <WindowManager
        store={store}
        toolbar={<span>Toolbar</span>}
        renderWindow={(window) => <div>{window.windowTypeId} body</div>}
      />,
    );

    expect(screen.getByText('Toolbar')).toBeDefined();
    expect(screen.getByText('chat body')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: '关闭Chat' }));
    expect(screen.getByText('工作台是空的，请从顶部打开一个窗口。')).toBeDefined();
  });
});
