/** @vitest-environment jsdom */
import { Editor } from '@tiptap/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createComposerExtensions } from './schema';

const editors: Editor[] = [];

function createEditor(onSubmit: () => boolean, text = '草稿') {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: createComposerExtensions(onSubmit),
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
  });
  editors.push(editor);
  return editor;
}

function enter(editor: Editor, shiftKey = false) {
  editor.view.dom.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', shiftKey, bubbles: true, cancelable: true }),
  );
}

afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy();
  vi.restoreAllMocks();
});

describe('composer keyboard behavior', () => {
  it('submits only the editor receiving Enter and survives another editor closing', () => {
    const firstSubmit = vi.fn(() => true);
    const secondSubmit = vi.fn(() => true);
    const first = createEditor(firstSubmit);
    const second = createEditor(secondSubmit);

    enter(first);
    expect(firstSubmit).toHaveBeenCalledOnce();
    expect(secondSubmit).not.toHaveBeenCalled();

    enter(second);
    expect(secondSubmit).toHaveBeenCalledOnce();
    expect(firstSubmit).toHaveBeenCalledOnce();

    second.destroy();
    enter(first);
    expect(firstSubmit).toHaveBeenCalledTimes(2);
    expect(secondSubmit).toHaveBeenCalledOnce();
  });

  it('keeps Shift+Enter as a line break without submitting', () => {
    const submit = vi.fn(() => true);
    const editor = createEditor(submit);
    editor.commands.setTextSelection('草稿'.length + 1);

    enter(editor, true);

    expect(submit).not.toHaveBeenCalled();
    expect(editor.getJSON().content?.[0]?.content).toContainEqual({ type: 'hardBreak' });
  });

  it('does not submit while an input method is composing', () => {
    const submit = vi.fn(() => true);
    const editor = createEditor(submit);
    vi.spyOn(editor.view, 'composing', 'get').mockReturnValue(true);

    enter(editor);

    expect(submit).not.toHaveBeenCalled();
  });
});
