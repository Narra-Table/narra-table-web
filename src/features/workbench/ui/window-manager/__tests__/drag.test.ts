import { describe, expect, it } from 'vitest';
import { createSequentialIdFactory } from '../../../model/window-manager/ids';
import { selectColumns } from '../../../model/window-manager/selectors';
import { createWorkbenchStore } from '../../../model/window-manager/store';
import { applyWorkbenchDrop } from '../drag';

function createStore() {
  return createWorkbenchStore({ createId: createSequentialIdFactory() });
}

function seed() {
  const store = createStore();
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
  const [chatColumn, sheetColumn] = selectColumns(store.getState());
  if (!chatColumn || !sheetColumn) throw new Error('missing columns');
  return { store, chat, sheet, chatColumn, sheetColumn };
}

describe('workbench drop rules', () => {
  it('merges a standard window into a target body as a stack', () => {
    const { store, chat, sheet, chatColumn } = seed();
    expect(
      applyWorkbenchDrop(
        store,
        {
          kind: 'window',
          instanceId: sheet,
          containerId: selectColumns(store.getState())[1]?.id ?? '',
        },
        { containerId: chatColumn.id, mode: 'stack' },
      ),
    ).toBe(true);
    const columns = selectColumns(store.getState());
    expect(columns).toHaveLength(1);
    expect(columns[0]?.display).toBe('normal');
    expect(columns[0]?.windows).toEqual([chat, sheet]);
    expect(store.getState().focus.focusedWindowId).toBe(sheet);
  });

  it('merges a standard window into a target header as tabs', () => {
    const { store, sheet, chatColumn } = seed();
    applyWorkbenchDrop(
      store,
      {
        kind: 'window',
        instanceId: sheet,
        containerId: selectColumns(store.getState())[1]?.id ?? '',
      },
      { containerId: chatColumn.id, mode: 'tab' },
    );
    const column = selectColumns(store.getState())[0];
    expect(column?.display).toBe('tabbed');
    expect(column?.windows).toHaveLength(2);
  });

  it('moves one row out of a multi-window column', () => {
    const store = createStore();
    const chat = store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    const first = selectColumns(store.getState())[0];
    if (!first) throw new Error('missing column');
    const sheet = store.actions.open({
      appId: 'demo',
      windowTypeId: 'sheet',
      title: 'Sheet',
      intoContainerId: first.id,
    });
    const notes = store.actions.open({
      appId: 'demo',
      windowTypeId: 'notes',
      title: 'Notes',
      width: 0.5,
    });
    const notesColumn = selectColumns(store.getState())[1];
    if (!notesColumn) throw new Error('missing target');
    expect(
      applyWorkbenchDrop(
        store,
        { kind: 'window', instanceId: sheet, containerId: first.id },
        { containerId: notesColumn.id, mode: 'stack' },
      ),
    ).toBe(true);
    const columns = selectColumns(store.getState());
    expect(columns[0]?.windows).toEqual([chat]);
    expect(columns[1]?.windows).toEqual([notes, sheet]);
  });

  it('reorders a column', () => {
    const { store, chat, sheet, chatColumn, sheetColumn } = seed();
    expect(
      applyWorkbenchDrop(
        store,
        { kind: 'column', containerId: chatColumn.id },
        { containerId: sheetColumn.id, mode: 'tab' },
      ),
    ).toBe(true);
    expect(selectColumns(store.getState()).map((column) => column.windows[0])).toEqual([
      sheet,
      chat,
    ]);
  });

  it('moves a window to the empty strip as a new column', () => {
    const { store, sheet } = seed();
    expect(
      applyWorkbenchDrop(
        store,
        {
          kind: 'window',
          instanceId: sheet,
          containerId: selectColumns(store.getState())[1]?.id ?? '',
        },
        { mode: 'stack' },
      ),
    ).toBe(true);
    const columns = selectColumns(store.getState());
    expect(columns).toHaveLength(2);
    expect(columns[1]?.windows).toEqual([sheet]);
  });

  it('does not merge a floating window into a column yet', () => {
    const store = createStore();
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
      floating: true,
    });
    const chatColumn = selectColumns(store.getState())[0];
    if (!chatColumn) throw new Error('missing column');
    const before = store.getState();
    expect(
      applyWorkbenchDrop(
        store,
        { kind: 'window', instanceId: sheet, containerId: 'floating' },
        { containerId: chatColumn.id, mode: 'tab' },
      ),
    ).toBe(false);
    expect(store.getState()).toBe(before);
    expect(store.getState().windows[chat]).toBeDefined();
  });

  it('turns a tabbed column into a stack when the body receives the drop', () => {
    const { store, chat, sheet, chatColumn } = seed();
    store.actions.setDisplay(chatColumn.id, 'tabbed');
    applyWorkbenchDrop(
      store,
      {
        kind: 'window',
        instanceId: sheet,
        containerId: selectColumns(store.getState())[1]?.id ?? '',
      },
      { containerId: chatColumn.id, mode: 'stack' },
    );
    const column = selectColumns(store.getState())[0];
    expect(column?.display).toBe('normal');
    expect(column?.windows).toEqual([chat, sheet]);
  });

  it('turns a stacked column into tabs when the rail receives the drop', () => {
    const store = createStore();
    const chat = store.actions.open({
      appId: 'demo',
      windowTypeId: 'chat',
      title: 'Chat',
      width: 0.5,
    });
    const first = selectColumns(store.getState())[0];
    if (!first) throw new Error('missing column');
    const sheet = store.actions.open({
      appId: 'demo',
      windowTypeId: 'sheet',
      title: 'Sheet',
      intoContainerId: first.id,
    });
    const notes = store.actions.open({
      appId: 'demo',
      windowTypeId: 'notes',
      title: 'Notes',
      width: 0.5,
    });
    const notesColumn = selectColumns(store.getState())[1];
    if (!notesColumn) throw new Error('missing target');
    applyWorkbenchDrop(
      store,
      { kind: 'window', instanceId: notes, containerId: notesColumn.id },
      { containerId: first.id, mode: 'tab' },
    );
    const column = selectColumns(store.getState())[0];
    expect(column?.display).toBe('tabbed');
    expect(column?.windows).toEqual([chat, sheet, notes]);
  });
});
