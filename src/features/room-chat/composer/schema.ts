import { Extension } from '@tiptap/core';
import Bold from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Italic from '@tiptap/extension-italic';
import Paragraph from '@tiptap/extension-paragraph';
import Strike from '@tiptap/extension-strike';
import Text from '@tiptap/extension-text';
import Underline from '@tiptap/extension-underline';
import { RubyMark, TextBackground, TextColor } from './marks';

const SubmitOnEnter = Extension.create<{ onSubmit: () => boolean }>({
  name: 'submitOnEnter',
  addOptions() {
    return { onSubmit: () => false };
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        if (this.editor.view.composing) return false;
        return this.options.onSubmit();
      },
    };
  },
});

const StrikeShortcut = Strike.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-x': () => this.editor.commands.toggleStrike(),
      'Mod-Shift-X': () => this.editor.commands.toggleStrike(),
    };
  },
});

export function createComposerExtensions(onSubmit: () => boolean = () => false) {
  return [
    Document.extend({ content: 'paragraph' }),
    Paragraph,
    Text,
    HardBreak,
    Bold,
    Italic,
    Underline,
    StrikeShortcut,
    // TextBackground 先注册，文字颜色的 mark 会落在它内层，显式颜色才能覆盖底色给的默认可读色。
    TextBackground,
    TextColor,
    RubyMark,
    SubmitOnEnter.configure({ onSubmit }),
  ];
}

export const composerExtensions = createComposerExtensions();
