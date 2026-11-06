/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSequentialIdFactory, createWindowManagerStore } from '../model/store';
import { resolveWindowHeaderTone, WindowManager } from './WindowManager';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function createOrientationMedia() {
  let portrait = false;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  return {
    matchMedia: (query: string) =>
      ({
        get matches() {
          return query.includes('orientation: portrait') ? portrait : false;
        },
        media: query,
        onchange: null,
        addEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => {
          if (type === 'change') listeners.add(listener);
        },
        removeEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => {
          if (type === 'change') listeners.delete(listener);
        },
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => true,
      }) as MediaQueryList,
    setPortrait: (value: boolean) => {
      portrait = value;
      const event = { matches: value } as MediaQueryListEvent;
      for (const listener of listeners) listener(event);
    },
  };
}

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
    expect(firstWindow?.className).toContain('border-r');
    expect(secondWindow?.className).toContain('border-r');
    expect(secondWindow?.className).toContain('border-border-subtle');
    expect(strip?.lastElementChild?.className).toContain('hidden');
  });

  it('restores and tracks the exact horizontal scroll position', () => {
    const store = createWindowManagerStore({ createId: createSequentialIdFactory() });
    store.actions.open({ appId: 'app', windowTypeId: 'chat', title: 'Chat', width: 1 / 2 });
    store.actions.open({ appId: 'app', windowTypeId: 'map', title: 'Map', width: 1 / 2 });
    store.actions.open({ appId: 'app', windowTypeId: 'clues', title: 'Clues', width: 1 / 2 });
    store.actions.setScrollLeft(420);

    render(
      <WindowManager store={store} renderWindow={(window) => <div>{window.windowTypeId}</div>} />,
    );

    const firstWindow = screen.getByRole('heading', { name: 'Chat' }).closest('article')
      ?.parentElement as HTMLDivElement;
    const strip = firstWindow.parentElement as HTMLDivElement;
    expect(strip.scrollLeft).toBe(420);

    strip.scrollLeft = 275;
    fireEvent.scroll(strip);
    expect(store.getState().scrollLeft).toBe(275);
  });

  it('moves the focused or newly opened window into view', () => {
    const store = createWindowManagerStore({ createId: createSequentialIdFactory() });
    store.actions.open({ appId: 'app', windowTypeId: 'chat', title: 'Chat', width: 1 / 2 });

    render(
      <WindowManager store={store} renderWindow={(window) => <div>{window.windowTypeId}</div>} />,
    );

    const firstWindow = screen.getByRole('heading', { name: 'Chat' }).closest('article')
      ?.parentElement as HTMLDivElement;
    const strip = firstWindow.parentElement as HTMLDivElement;
    const scrollTo = vi.fn(({ left }: ScrollToOptions) => {
      strip.scrollLeft = Number(left);
    });

    Object.defineProperties(strip, {
      scrollLeft: { value: 0, writable: true },
      scrollTo: { value: scrollTo },
      getBoundingClientRect: {
        value: () => ({ left: 0, right: 1000, width: 1000 }),
      },
    });

    const rectangles = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        if (this.textContent?.includes('map')) {
          return { left: 1000, right: 1500, width: 500 } as DOMRect;
        }
        return { left: 0, right: 500, width: 500 } as DOMRect;
      });

    act(() => {
      store.actions.open({ appId: 'app', windowTypeId: 'map', title: 'Map', width: 1 / 2 });
    });
    expect(store.getState().focusedWindowId).toBe('win-2');
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 500, behavior: 'smooth' });

    const lastWindow = screen.getByRole('heading', { name: 'Map' }).closest('article')
      ?.parentElement as HTMLDivElement;
    rectangles.mockRestore();
    Object.defineProperty(firstWindow, 'getBoundingClientRect', {
      value: () => ({ left: -500, right: 0, width: 500 }),
    });
    fireEvent.pointerDown(firstWindow.firstElementChild as HTMLElement);
    expect(store.getState().focusedWindowId).toBe('win-1');
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: 'smooth' });

    fireEvent.pointerDown(lastWindow.firstElementChild as HTMLElement);
    expect(store.getState().focusedWindowId).toBe('win-2');
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

  it('preserves window state while switching between portrait and landscape', () => {
    const media = createOrientationMedia();
    vi.stubGlobal('matchMedia', media.matchMedia);
    const store = createWindowManagerStore({ createId: createSequentialIdFactory() });
    store.actions.open({ appId: 'app', windowTypeId: 'chat', title: 'Chat' });
    store.actions.open({ appId: 'app', windowTypeId: 'map', title: 'Map' });

    render(
      <WindowManager
        store={store}
        renderWindow={(window) => <input aria-label={`${window.title} input`} defaultValue="" />}
      />,
    );

    const chatInput = screen.getByLabelText<HTMLInputElement>('Chat input');
    fireEvent.change(chatInput, { target: { value: '未提交的用户输入' } });

    act(() => media.setPortrait(true));
    expect(screen.getByRole('tab', { name: 'Map' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByLabelText('Chat input')).toBe(chatInput);
    expect(chatInput.value).toBe('未提交的用户输入');

    fireEvent.click(screen.getByRole('tab', { name: 'Chat' }));
    expect(screen.getByRole('tab', { name: 'Chat' }).getAttribute('aria-selected')).toBe('true');

    act(() => media.setPortrait(false));
    expect(screen.queryByRole('tablist', { name: '窗口' })).toBeNull();
    expect(screen.getByLabelText('Chat input')).toBe(chatInput);
    expect(chatInput.value).toBe('未提交的用户输入');
  });
});
