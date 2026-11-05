/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createSequentialIdFactory, createWindowManagerStore } from '../model/store';
import { MobileWindowManager, resolveWindowHeaderTone } from './MobileWindowManager';
import { WindowManager } from './WindowManager';

afterEach(cleanup);

describe('WindowManager', () => {
  it('keeps header colors fixed by window type', () => {
    expect(resolveWindowHeaderTone('chat')).toBe('bg-accent/15 text-accent');
    expect(resolveWindowHeaderTone('characters')).toBe('bg-info/15 text-info');
    expect(resolveWindowHeaderTone('combat')).toBe('bg-danger/15 text-danger');
    expect(resolveWindowHeaderTone('unknown')).toBe('bg-surface-muted text-text');
  });

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

  it('fits fractional windows without extra spacing', () => {
    const store = createWindowManagerStore({ createId: createSequentialIdFactory() });
    store.actions.open({ appId: 'app', windowTypeId: 'chat', title: 'Chat', width: 1 / 2 });
    store.actions.open({ appId: 'app', windowTypeId: 'map', title: 'Map', width: 1 / 2 });

    render(
      <WindowManager store={store} renderWindow={(window) => <div>{window.windowTypeId}</div>} />,
    );

    const firstWindow = screen
      .getByRole('heading', { name: 'Chat' })
      .closest('article')?.parentElement;
    const secondWindow = screen
      .getByRole('heading', { name: 'Map' })
      .closest('article')?.parentElement;
    const strip = firstWindow?.parentElement;

    expect(strip?.className).not.toContain('gap-1');
    expect(firstWindow?.className).toContain('w-1/2');
    expect(secondWindow?.className).toContain('w-1/2');
    expect(secondWindow?.className).toContain('border-l');
    expect(secondWindow?.className).toContain('border-border-subtle');
    expect(strip?.lastElementChild?.className).toContain('hidden');
  });

  it('resizes desktop windows between snapped widths', async () => {
    const store = createWindowManagerStore({ createId: createSequentialIdFactory() });
    store.actions.open({ appId: 'app', windowTypeId: 'chat', title: 'Chat', width: 1 / 2 });

    render(
      <WindowManager store={store} renderWindow={(window) => <div>{window.windowTypeId}</div>} />,
    );

    const handle = screen.getByRole('separator', { name: '调整Chat窗口宽度' });
    const windowElement = handle.parentElement;
    const strip = windowElement?.parentElement;
    Object.defineProperty(strip, 'getBoundingClientRect', {
      value: () => ({ left: 0, right: 1000, width: 1000 }),
    });

    expect(handle.className).not.toContain('translate-x-1/2');
    expect(handle.firstElementChild?.className).toContain('right-0');

    fireEvent(handle, new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 500 }));
    const trailingSpace = strip?.lastElementChild as HTMLElement | null;
    expect(trailingSpace?.className).toContain('hidden');
    expect(trailingSpace?.style.width).toBe('0px');
    fireEvent(handle, new MouseEvent('pointermove', { bubbles: true, clientX: 900 }));
    expect(windowElement?.style.width).toBe('90%');
    expect(trailingSpace?.className).toContain('hidden');
    expect(store.getState().windows[0]?.width).toBe(1 / 2);
    if (strip) strip.scrollLeft = 200;
    fireEvent(handle, new MouseEvent('pointermove', { bubbles: true, clientX: 900 }));
    expect(windowElement?.style.width).toBe('100%');
    fireEvent(handle, new MouseEvent('pointerup', { bubbles: true, clientX: 900 }));
    expect(store.getState().windows[0]?.width).toBe(1);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(trailingSpace?.style.width).toBe('0px');
    expect(trailingSpace?.className).toContain('hidden');

    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(store.getState().windows[0]?.width).toBe(2 / 3);
    expect(windowElement?.className).toContain('w-2/3');
    expect(handle.getAttribute('aria-valuetext')).toBe('三分之二');

    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(store.getState().windows[0]?.width).toBe(1 / 2);
  });

  it('keeps edge auto-scroll active while the pointer crosses a resize handle', () => {
    const store = createWindowManagerStore({ createId: createSequentialIdFactory() });
    store.actions.open({ appId: 'app', windowTypeId: 'chat', title: 'Chat' });

    const { container } = render(
      <WindowManager
        edgeAutoScroll
        store={store}
        renderWindow={(window) => <div>{window.windowTypeId}</div>}
      />,
    );

    const handle = screen.getByRole('separator', { name: '调整Chat窗口宽度' });
    const strip = handle.parentElement?.parentElement;
    Object.defineProperties(strip, {
      clientWidth: { value: 1000 },
      scrollWidth: { value: 2000 },
      scrollLeft: { value: 500, writable: true },
      getBoundingClientRect: {
        value: () => ({ left: 0, right: 1000, width: 1000 }),
      },
    });

    fireEvent(handle, new MouseEvent('pointermove', { bubbles: true, buttons: 0, clientX: 999 }));

    expect(container.querySelector('[data-edge-indicator="right"]')?.className).toContain(
      'opacity-100',
    );
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
