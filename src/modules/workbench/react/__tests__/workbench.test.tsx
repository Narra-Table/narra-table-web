/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSequentialIdFactory } from '../../core/ids';
import { selectColumns } from '../../core/selectors';
import { createWorkbenchStore } from '../../core/store';
import type { WindowInstance } from '../../core/types';
import { WorkbenchProvider, useOpenWindow } from '../context';
import { createAppRegistry } from '../types';
import { Workbench } from '../Workbench';

afterEach(cleanup);

const APP_REGISTRY = createAppRegistry([
  {
    appId: 'demo',
    windowTypeId: 'chat',
    title: 'Chat',
    appName: 'Demo',
    defaultWidth: 0.5,
  },
  {
    appId: 'demo',
    windowTypeId: 'sheet',
    title: 'Sheet',
    appName: 'Demo',
    defaultWidth: 0.5,
    singleton: true,
  },
]);

function createStore() {
  return createWorkbenchStore({ createId: createSequentialIdFactory() });
}

function renderWindow(window: WindowInstance) {
  return <div data-testid={`content-${window.instanceId}`}>{window.title} body</div>;
}

function renderWorkbench(
  store: ReturnType<typeof createStore>,
  options: {
    registry?: typeof APP_REGISTRY;
    renderer?: (window: WindowInstance) => ReactNode;
    toolbar?: ReactNode;
    keyboard?: boolean;
    onEscape?: () => void;
    narrow?: boolean;
  } = {},
) {
  return render(
    <WorkbenchProvider
      store={store}
      registry={options.registry ?? APP_REGISTRY}
      renderWindow={options.renderer ?? renderWindow}
    >
      <Workbench
        toolbar={options.toolbar}
        keyboard={options.keyboard}
        onEscape={options.onEscape}
        narrow={options.narrow}
      />
    </WorkbenchProvider>,
  );
}

function placeCaret(element: HTMLElement, offset: number) {
  const text = element.firstChild;
  if (!text) throw new Error('missing text node');
  const range = document.createRange();
  range.setStart(text, offset);
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function dispatchPointer(target: Element, type: string, x: number, y: number) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    button: 0,
  });
  target.dispatchEvent(event);
}

function mockScroll(
  element: HTMLElement,
  metrics: {
    scrollWidth?: number;
    clientWidth?: number;
    scrollLeft?: number;
    scrollHeight?: number;
    clientHeight?: number;
    scrollTop?: number;
  },
) {
  for (const [key, value] of Object.entries(metrics)) {
    Object.defineProperty(element, key, { configurable: true, value });
  }
}

function seedTwoColumns(store: ReturnType<typeof createStore>) {
  const chat = store.actions.open({
    appId: 'demo',
    windowTypeId: 'chat',
    title: 'Chat',
    width: 0.5,
  });
  const sheet = store.actions.open({
    appId: 'demo',
    windowTypeId: 'sheet',
    title: 'Sheet',
    width: 0.5,
  });
  return { chat, sheet };
}

describe('React workbench shell', () => {
  it('renders columns, windows, toolbar and taskbar', () => {
    const store = createStore();
    const { chat, sheet } = seedTwoColumns(store);
    renderWorkbench(store, { toolbar: <span>Host toolbar</span> });

    expect(document.querySelectorAll('.wm-column')).toHaveLength(2);
    expect(document.querySelectorAll('.wm-column-chrome')).toHaveLength(2);
    expect(document.querySelector('.wm-column-header')).toBeNull();
    expect(document.querySelector('.wm-rail')).toBeNull();
    expect(document.querySelector('.wm-window-chrome')).toBeNull();
    expect(screen.queryByRole('button', { name: 'File' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(document.querySelectorAll('.wm-window')).toHaveLength(2);
    expect(screen.getByText('Host toolbar')).toBeTruthy();
    expect(screen.getByTestId(`content-${chat}`)).toBeTruthy();
    expect(screen.getByTestId(`content-${sheet}`)).toBeTruthy();
    expect(screen.getByLabelText('Taskbar')).toBeTruthy();
    expect(document.querySelectorAll('.wm-window[data-focused="true"]')).toHaveLength(1);
  });

  it('focuses a window on pointer down and through the taskbar', () => {
    const store = createStore();
    const { chat, sheet } = seedTwoColumns(store);
    renderWorkbench(store);

    const windows = [...document.querySelectorAll('.wm-window')];
    const chatWindow = windows.find((window) => window.textContent?.includes('Chat body'));
    const sheetWindow = windows.find((window) => window.textContent?.includes('Sheet body'));
    expect(chatWindow).toBeDefined();
    expect(sheetWindow).toBeDefined();

    fireEvent.pointerDown(sheetWindow as Element);
    expect(store.getState().focus.focusedWindowId).toBe(sheet);
    expect((sheetWindow as HTMLElement).getAttribute('data-focused')).toBe('true');

    const taskbar = screen.getByLabelText('Taskbar');
    fireEvent.click(within(taskbar).getByRole('button', { name: 'Chat' }));
    expect(store.getState().focus.focusedWindowId).toBe(chat);
  });

  it('closes the focused window from its chrome', () => {
    const store = createStore();
    const { chat, sheet } = seedTwoColumns(store);
    renderWorkbench(store);

    const sheetColumn = [...document.querySelectorAll('.wm-column')].find(
      (column) => column.querySelector('.wm-chrome-title')?.textContent === 'Sheet',
    );
    expect(sheetColumn).toBeDefined();
    fireEvent.click(within(sheetColumn as HTMLElement).getByLabelText('关闭'));
    expect(store.getState().windows[sheet]).toBeUndefined();
    expect(store.getState().focus.focusedWindowId).toBe(chat);
    expect(screen.queryByTestId(`content-${sheet}`)).toBeNull();
  });

  it('switches a column to tabs and changes the active tab', () => {
    const store = createStore();
    const chat = store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    const column = selectColumns(store.getState())[0];
    if (!column) throw new Error('missing column');
    const sheet = store.actions.open({
      appId: 'demo',
      windowTypeId: 'sheet',
      title: 'Sheet',
      intoContainerId: column.id,
    });
    store.actions.setDisplay(column.id, 'tabbed');
    renderWorkbench(store);

    expect(screen.getByRole('tab', { name: 'Chat' })).toBeTruthy();
    const chatContent = screen.getByTestId(`content-${chat}`);
    fireEvent.click(screen.getByRole('tab', { name: 'Sheet' }));
    expect(store.getState().focus.focusedWindowId).toBe(sheet);
    expect(screen.getByTestId(`content-${sheet}`)).toBeTruthy();
    // The inactive tab stays mounted in the stable host storage, with the
    // exact same DOM node rather than a remounted copy.
    const inactive = screen.getByTestId(`content-${chat}`);
    expect(inactive).toBe(chatContent);
    expect(document.querySelector('[data-wm-window-storage]')?.contains(inactive)).toBe(true);
  });

  it('keeps a window content node when moving it to another column', () => {
    const store = createStore();
    const { chat, sheet } = seedTwoColumns(store);
    renderWorkbench(store);

    const sheetContent = screen.getByTestId(`content-${sheet}`);
    const columns = selectColumns(store.getState());
    const target = columns.find((column) => column.windows.includes(chat));
    if (!target) throw new Error('missing target column');
    act(() => {
      store.actions.moveToColumn(sheet, target.id);
    });

    expect(selectColumns(store.getState())).toHaveLength(1);
    expect(screen.getByTestId(`content-${sheet}`)).toBe(sheetContent);
    expect(store.getState().focus.focusedWindowId).toBe(sheet);
  });

  it('opens windows through the host hook with type defaults', () => {
    const store = createStore();
    let opened: string | null = null;
    function Host() {
      const open = useOpenWindow();
      return (
        <button
          type="button"
          onClick={() => {
            opened = open('demo', 'chat');
          }}
        >
          open chat
        </button>
      );
    }
    renderWorkbench(store, { toolbar: <Host /> });

    fireEvent.click(screen.getByText('open chat'));
    expect(opened).not.toBeNull();
    const openedId = opened;
    if (!openedId) throw new Error('missing instance id');
    expect(store.getState().windows[openedId]?.title).toBe('Chat');
    expect(store.getState().windows[openedId]?.chrome).toBe('full');
  });

  it('applies width presets from the column menu', () => {
    const store = createStore();
    store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    renderWorkbench(store);

    fireEvent.click(screen.getByLabelText('菜单'));
    fireEvent.click(screen.getByRole('menuitem', { name: '1/3' }));
    expect(selectColumns(store.getState())[0]?.width).toBeCloseTo(1 / 3);
  });

  it('reloads the column menu on right click and leaves window text alone', () => {
    const store = createStore();
    const chat = store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    renderWorkbench(store);

    const chrome = document.querySelector('.wm-column-chrome');
    if (!chrome) throw new Error('missing column chrome');
    expect(fireEvent.contextMenu(chrome, { clientX: 24, clientY: 32 })).toBe(false);
    fireEvent.click(screen.getByRole('menuitem', { name: '1/2' }));
    expect(selectColumns(store.getState())[0]?.width).toBeCloseTo(1 / 2);
    expect(screen.queryByRole('menu')).toBeNull();

    expect(fireEvent.contextMenu(screen.getByTestId(`content-${chat}`))).toBe(true);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('renders floating windows and docks them', () => {
    const store = createStore();
    store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
      floating: true,
    });
    renderWorkbench(store);

    expect(document.querySelectorAll('.wm-floating')).toHaveLength(1);
    expect(document.querySelector('.wm-window-chrome')).not.toBeNull();
    expect((screen.getByLabelText('宽度') as HTMLButtonElement).disabled).toBe(true);
    const chrome = document.querySelector('.wm-window-chrome');
    if (!chrome) throw new Error('missing float chrome');
    expect(fireEvent.contextMenu(chrome, { clientX: 80, clientY: 40 })).toBe(false);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Dock' }));
    expect(document.querySelectorAll('.wm-floating')).toHaveLength(0);
    expect(selectColumns(store.getState())).toHaveLength(1);
  });

  it('drags a floating window by its title', () => {
    const store = createStore();
    store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      floating: true,
      floatingBox: { x: 40, y: 50, width: 320, height: 240 },
    });
    renderWorkbench(store);

    const handle = document.querySelector('.wm-window-chrome .wm-chrome-drag');
    if (!handle) throw new Error('missing float handle');
    dispatchPointer(handle, 'pointerdown', 100, 80);
    dispatchPointer(handle, 'pointermove', 130, 110);
    dispatchPointer(handle, 'pointerup', 130, 110);

    const floating = store.getState().containers.find((container) => container.kind === 'floating');
    expect(floating).toMatchObject({ x: 70, y: 80 });
  });

  it('isolates a window render error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const store = createStore();
    store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    renderWorkbench(store, {
      renderer: () => {
        throw new Error('boom');
      },
    });

    expect(screen.getByText('This window failed to render.')).toBeTruthy();
    error.mockRestore();
  });

  it('focuses columns with Ctrl+Arrow', () => {
    const store = createStore();
    const { chat, sheet } = seedTwoColumns(store);
    renderWorkbench(store);
    const workspace = screen.getByLabelText('Workspace');

    fireEvent.keyDown(workspace, { key: 'ArrowLeft', ctrlKey: true });
    expect(store.getState().focus.focusedWindowId).toBe(chat);
    fireEvent.keyDown(workspace, { key: 'ArrowRight', ctrlKey: true });
    expect(store.getState().focus.focusedWindowId).toBe(sheet);
  });

  it('moves a single-window column with Ctrl+Shift+Arrow', () => {
    const store = createStore();
    const { chat, sheet } = seedTwoColumns(store);
    renderWorkbench(store);
    const workspace = screen.getByLabelText('Workspace');

    fireEvent.keyDown(workspace, { key: 'ArrowLeft', ctrlKey: true });
    fireEvent.keyDown(workspace, {
      key: 'ArrowRight',
      ctrlKey: true,
      shiftKey: true,
    });
    expect(selectColumns(store.getState()).map((column) => column.windows[0])).toEqual([
      sheet,
      chat,
    ]);
  });

  it('resizes the focused column with Ctrl+Alt+Arrow', () => {
    const store = createStore();
    seedTwoColumns(store);
    renderWorkbench(store);
    const workspace = screen.getByLabelText('Workspace');

    const before = selectColumns(store.getState())[1]?.width ?? 0;
    fireEvent.keyDown(workspace, {
      key: 'ArrowLeft',
      ctrlKey: true,
      altKey: true,
    });
    expect(selectColumns(store.getState())[1]?.width).toBeCloseTo(before - 0.05);
  });

  it('ignores workspace shortcuts inside editors but keeps the escape hatch', () => {
    const store = createStore();
    seedTwoColumns(store);
    const onEscape = vi.fn();
    renderWorkbench(store, {
      onEscape,
      toolbar: <input data-testid="editor" />,
    });
    const editor = screen.getByTestId('editor');
    const focusedBefore = store.getState().focus.focusedWindowId;

    fireEvent.keyDown(editor, { key: 'ArrowLeft', ctrlKey: true });
    expect(store.getState().focus.focusedWindowId).toBe(focusedBefore);

    fireEvent.keyDown(editor, {
      key: 'Escape',
      ctrlKey: true,
      altKey: true,
    });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('can disable the default keymap', () => {
    const store = createStore();
    const { sheet } = seedTwoColumns(store);
    renderWorkbench(store, { keyboard: false });
    const workspace = screen.getByLabelText('Workspace');
    fireEvent.keyDown(workspace, { key: 'ArrowLeft', ctrlKey: true });
    expect(store.getState().focus.focusedWindowId).toBe(sheet);
  });

  it('stops navigation keys from panning the strip', () => {
    const store = createStore();
    store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    renderWorkbench(store, {
      narrow: false,
      renderer: () => (
        <div>
          <input data-testid="field" defaultValue="hello" />
          <div contentEditable data-testid="editor" suppressContentEditableWarning>
            hello
          </div>
          <div data-testid="wide" style={{ overflowX: 'auto' }}>
            wide
          </div>
          <div data-testid="log" style={{ overflowY: 'auto' }}>
            log
          </div>
        </div>
      ),
    });
    const workspace = screen.getByLabelText('Workspace');
    for (const key of [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'PageUp',
      'PageDown',
    ]) {
      expect(fireEvent.keyDown(workspace, { key })).toBe(false);
    }

    const field = screen.getByTestId('field') as HTMLInputElement;
    field.setSelectionRange(2, 2);
    expect(fireEvent.keyDown(field, { key: 'ArrowLeft' })).toBe(true);
    field.setSelectionRange(0, 0);
    expect(fireEvent.keyDown(field, { key: 'ArrowLeft' })).toBe(false);
    expect(fireEvent.keyDown(field, { key: 'Home' })).toBe(false);
    expect(fireEvent.keyDown(field, { key: 'PageDown' })).toBe(false);

    const editor = screen.getByTestId('editor');
    placeCaret(editor, 2);
    expect(fireEvent.keyDown(editor, { key: 'ArrowLeft' })).toBe(true);
    expect(fireEvent.keyDown(editor, { key: 'Home' })).toBe(true);
    placeCaret(editor, 0);
    expect(fireEvent.keyDown(editor, { key: 'ArrowLeft' })).toBe(false);
    expect(fireEvent.keyDown(editor, { key: 'Home' })).toBe(false);
    expect(fireEvent.keyDown(editor, { key: 'PageDown' })).toBe(false);

    const wide = screen.getByTestId('wide');
    mockScroll(wide, { scrollWidth: 400, clientWidth: 80, scrollLeft: 20 });
    expect(fireEvent.keyDown(wide, { key: 'ArrowRight' })).toBe(true);
    expect(fireEvent.keyDown(wide, { key: 'ArrowLeft' })).toBe(true);
    mockScroll(wide, { scrollWidth: 400, clientWidth: 80, scrollLeft: 0 });
    expect(fireEvent.keyDown(wide, { key: 'ArrowLeft' })).toBe(false);

    const log = screen.getByTestId('log');
    mockScroll(log, { scrollHeight: 400, clientHeight: 80, scrollTop: 20 });
    expect(fireEvent.keyDown(log, { key: 'PageDown' })).toBe(true);
    expect(fireEvent.keyDown(log, { key: 'End' })).toBe(true);
    mockScroll(log, { scrollHeight: 400, clientHeight: 80, scrollTop: 0 });
    expect(fireEvent.keyDown(log, { key: 'PageUp' })).toBe(false);
    expect(fireEvent.keyDown(log, { key: 'Home' })).toBe(false);
  });

  it('opens an app from the launcher', () => {
    const store = createStore();
    renderWorkbench(store);
    fireEvent.click(screen.getByRole('button', { name: 'Apps' }));
    const dialog = screen.getByRole('dialog', { name: 'Apps' });
    fireEvent.change(within(dialog).getByPlaceholderText('Search apps and windows'), {
      target: { value: 'chat' },
    });
    fireEvent.click(within(dialog).getByRole('option', { name: /Chat/ }));
    expect(Object.values(store.getState().windows)[0]?.title).toBe('Chat');
    expect(screen.queryByRole('dialog', { name: 'Apps' })).toBeNull();
  });

  it('closes the launcher with Escape', () => {
    const store = createStore();
    renderWorkbench(store);
    fireEvent.click(screen.getByRole('button', { name: 'Apps' }));
    const dialog = screen.getByRole('dialog', { name: 'Apps' });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Apps' })).toBeNull();
  });

  it('focuses an existing window from the launcher windows tab', () => {
    const store = createStore();
    const { sheet } = seedTwoColumns(store);
    renderWorkbench(store);
    fireEvent.click(screen.getByRole('button', { name: 'Apps' }));
    const dialog = screen.getByRole('dialog', { name: 'Apps' });
    fireEvent.click(within(dialog).getByRole('tab', { name: 'Windows' }));
    fireEvent.click(within(dialog).getByRole('option', { name: /Sheet/ }));
    expect(store.getState().focus.focusedWindowId).toBe(sheet);
    expect(screen.queryByRole('dialog', { name: 'Apps' })).toBeNull();
  });

  it('inserts an app into the current column from the + button', () => {
    const store = createStore();
    const chat = store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    const column = selectColumns(store.getState())[0];
    if (!column) throw new Error('missing column');
    store.actions.open({
      appId: 'demo',
      windowTypeId: 'sheet',
      title: 'Sheet',
      intoContainerId: column.id,
    });
    renderWorkbench(store);

    const plus = document.querySelector('.wm-rail-add');
    expect(plus).not.toBeNull();
    fireEvent.click(plus as Element);
    const dialog = screen.getByRole('dialog', { name: 'Apps' });
    expect(within(dialog).getByText('Add to current container')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('option', { name: /Chat/ }));
    const updated = selectColumns(store.getState())[0];
    expect(updated?.windows).toHaveLength(3);
    expect(updated?.windows[0]).toBe(chat);
  });

  it('projects one container at a time in narrow mode', () => {
    const store = createStore();
    const { chat, sheet } = seedTwoColumns(store);
    renderWorkbench(store, { narrow: true });

    expect(document.querySelector('.wm-narrow')).not.toBeNull();
    expect(document.querySelectorAll('.wm-column')).toHaveLength(1);
    expect(document.querySelectorAll('.wm-narrow-tab')).toHaveLength(2);
    expect(store.getState().focus.focusedWindowId).toBe(sheet);

    fireEvent.click(document.querySelectorAll('.wm-narrow-tab')[0] as Element);
    expect(store.getState().focus.focusedWindowId).toBe(chat);
  });

  it('keeps stacked rows visible behind the vertical rail in narrow mode', () => {
    const store = createStore();
    const chat = store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    const column = selectColumns(store.getState())[0];
    if (!column) throw new Error('missing column');
    const sheet = store.actions.open({
      appId: 'demo',
      windowTypeId: 'sheet',
      title: 'Sheet',
      intoContainerId: column.id,
    });
    renderWorkbench(store, { narrow: true });

    expect(document.querySelectorAll('.wm-narrow-row-tab')).toHaveLength(0);
    expect(document.querySelectorAll('.wm-narrow-tab')).toHaveLength(1);
    expect(document.querySelector('.wm-rail')).not.toBeNull();
    expect(document.querySelectorAll('.wm-stack-row')).toHaveLength(2);
    expect(screen.getByTestId(`content-${chat}`)).toBeTruthy();
    expect(screen.getByTestId(`content-${sheet}`)).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Chat' }));
    expect(store.getState().focus.focusedWindowId).toBe(chat);
    expect(screen.getByTestId(`content-${sheet}`)).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Sheet' }));
    expect(store.getState().focus.focusedWindowId).toBe(sheet);
    expect(document.querySelectorAll('.wm-stack-row')).toHaveLength(2);
  });

  it('shows a focused floating window as a narrow sheet', () => {
    const store = createStore();
    store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    store.actions.open({
      appId: 'demo',
      windowTypeId: 'sheet',
      title: 'Sheet',
      floating: true,
    });
    renderWorkbench(store, { narrow: true });

    expect(document.querySelectorAll('.wm-narrow-sheet')).toHaveLength(1);
    expect(document.querySelectorAll('.wm-narrow-tab')).toHaveLength(2);
    const firstTab = document.querySelectorAll('.wm-narrow-tab')[0];
    expect(firstTab).toBeDefined();
    if (firstTab) fireEvent.click(firstTab);
    expect(document.querySelectorAll('.wm-narrow-sheet')).toHaveLength(0);
  });

  it('rejects opening an unregistered window type', () => {
    const store = createStore();
    let result: string | null = 'unset';
    function Host() {
      const open = useOpenWindow();
      return (
        <button
          type="button"
          onClick={() => {
            result = open('missing', 'none');
          }}
        >
          open missing
        </button>
      );
    }
    renderWorkbench(store, { toolbar: <Host /> });
    fireEvent.click(screen.getByText('open missing'));
    expect(result).toBeNull();
    expect(store.getState().containers).toHaveLength(0);
  });

  it('pages from the rail and keeps a stack fully visible', () => {
    const store = createStore();
    const chat = store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    const column = selectColumns(store.getState())[0];
    if (!column) throw new Error('missing column');
    const sheet = store.actions.open({
      appId: 'demo',
      windowTypeId: 'sheet',
      title: 'Sheet',
      intoContainerId: column.id,
    });
    renderWorkbench(store);

    expect(document.querySelectorAll('.wm-stack-row')).toHaveLength(2);
    expect(document.querySelector(`[data-wm-slot="${chat}"]`)).not.toBeNull();
    expect(document.querySelector(`[data-wm-slot="${sheet}"]`)).not.toBeNull();
    const before = selectColumns(store.getState())[0]?.windows.slice();

    fireEvent.click(screen.getByLabelText('菜单'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Switch to tabs' }));
    expect(selectColumns(store.getState())[0]?.display).toBe('tabbed');
    expect(selectColumns(store.getState())[0]?.windows).toEqual(before);
    expect(document.querySelectorAll('.wm-stack-row')).toHaveLength(0);
    expect(document.querySelectorAll('.wm-column [data-wm-slot]')).toHaveLength(1);
    expect(screen.getByTestId(`content-${chat}`)).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Chat' }));
    expect(store.getState().focus.focusedWindowId).toBe(chat);
    expect(document.querySelector('.wm-column [data-wm-slot]')?.getAttribute('data-wm-slot')).toBe(
      chat,
    );

    fireEvent.click(screen.getByLabelText('菜单'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Switch to stack' }));
    expect(selectColumns(store.getState())[0]?.display).toBe('normal');
    expect(selectColumns(store.getState())[0]?.windows).toEqual(before);
    expect(document.querySelectorAll('.wm-stack-row')).toHaveLength(2);
    expect(screen.getByTestId(`content-${sheet}`)).toBeTruthy();
  });

  it('toggles full width from the green light without a long press', () => {
    const store = createStore();
    store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    renderWorkbench(store);

    fireEvent.click(screen.getByLabelText('宽度'));
    expect(selectColumns(store.getState())[0]?.width).toBe(1);
    fireEvent.click(screen.getByLabelText('宽度'));
    expect(selectColumns(store.getState())[0]?.width).toBeCloseTo(0.5);
  });

  it('renders a window menu only when the registration declares one', () => {
    const store = createStore();
    const registry = createAppRegistry([
      {
        appId: 'demo',
        windowTypeId: 'chat',
        title: 'Chat',
        appName: 'Demo',
        menus: [{ label: 'File', items: [{ label: 'Save' }] }],
      },
    ]);
    store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    renderWorkbench(store, { registry });

    fireEvent.click(screen.getByRole('button', { name: 'File' }));
    expect(screen.getByRole('menuitem', { name: 'Save' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  });

  it('shows a tab band and a stack body while dragging onto a single window', () => {
    const store = createStore();
    store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    const column = selectColumns(store.getState())[0];
    if (!column) throw new Error('missing column');
    store.actions.open({
      appId: 'demo',
      windowTypeId: 'sheet',
      title: 'Sheet',
      intoContainerId: column.id,
    });
    const notes = store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Notes',
      width: 0.5,
    });
    renderWorkbench(store);

    fireEvent.dragStart(screen.getByRole('tab', { name: 'Sheet' }));
    const notesColumn = [...document.querySelectorAll('.wm-column')].find(
      (item) => item.querySelector('.wm-chrome-title')?.textContent === 'Notes',
    );
    expect(notesColumn).toBeDefined();
    const target = notesColumn as HTMLElement;
    fireEvent.dragOver(target.querySelector('.wm-column-content') as Element);
    expect(target.querySelector('.wm-drop-overlay')?.getAttribute('data-layout')).toBe('band');
    expect(target.querySelector('.wm-drop-overlay')?.getAttribute('data-hot')).toBe('stack');
    expect(target.querySelector('.wm-drop-zone-band')?.getAttribute('data-hot')).toBe('false');
    expect(target.querySelector('.wm-drop-zone-body')?.getAttribute('data-hot')).toBe('true');

    fireEvent.dragOver(target.querySelector('.wm-column-chrome') as Element);
    expect(target.querySelector('.wm-drop-overlay')?.getAttribute('data-hot')).toBe('tab');
    expect(target.querySelector('.wm-drop-zone-band')?.getAttribute('data-hot')).toBe('true');
    expect(target.querySelector('.wm-drop-zone-body')?.getAttribute('data-hot')).toBe('false');

    fireEvent.drop(target.querySelector('.wm-column-chrome') as Element);
    const updated = selectColumns(store.getState()).find((item) => item.windows.includes(notes));
    expect(updated?.display).toBe('tabbed');
    expect(updated?.windows).toContain(notes);
    expect(updated?.windows).toHaveLength(2);
  });

  it('splits a multi-window drop into a rail zone and a body zone', () => {
    const store = createStore();
    store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    const column = selectColumns(store.getState())[0];
    if (!column) throw new Error('missing column');
    store.actions.open({
      appId: 'demo',
      windowTypeId: 'sheet',
      title: 'Sheet',
      intoContainerId: column.id,
    });
    renderWorkbench(store);

    fireEvent.dragStart(screen.getByRole('tab', { name: 'Sheet' }));
    const target = document.querySelector('.wm-column');
    expect(target).not.toBeNull();
    fireEvent.dragOver(target?.querySelector('.wm-rail') as Element);
    expect(target?.querySelector('.wm-drop-overlay')?.getAttribute('data-layout')).toBe('rail');
    expect(target?.querySelector('.wm-drop-zone-rail')?.getAttribute('data-hot')).toBe('true');
    expect(target?.querySelector('.wm-drop-zone-body')?.getAttribute('data-hot')).toBe('false');

    fireEvent.dragOver(target?.querySelector('.wm-column-content') as Element);
    expect(target?.querySelector('.wm-drop-zone-rail')?.getAttribute('data-hot')).toBe('false');
    expect(target?.querySelector('.wm-drop-zone-body')?.getAttribute('data-hot')).toBe('true');

    fireEvent.dragEnd(screen.getByRole('tab', { name: 'Sheet' }));
    expect(document.querySelector('.wm-drop-overlay')).toBeNull();
  });
});
