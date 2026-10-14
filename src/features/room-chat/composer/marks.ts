import { Mark, mergeAttributes } from '@tiptap/core';
import { THEME_TEXT_CLASS, isThemeColor, normalizeColor } from '../model/richText';

export const TextColor = Mark.create({
  name: 'textColor',

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-color'),
        renderHTML: (attributes: { color?: string | null }) => {
          if (!attributes.color) return {};
          return { 'data-color': attributes.color };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-color]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const raw =
      typeof HTMLAttributes['data-color'] === 'string' ? HTMLAttributes['data-color'] : '';
    const color = normalizeColor(raw);
    if (color && isThemeColor(color)) {
      return ['span', mergeAttributes(HTMLAttributes, { class: THEME_TEXT_CLASS[color] }), 0];
    }
    if (color) {
      return ['span', mergeAttributes(HTMLAttributes, { style: `color: ${color}` }), 0];
    }
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

export const RubyMark = Mark.create({
  name: 'ruby',

  addAttributes() {
    return {
      ruby: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-ruby'),
        renderHTML: (attributes: { ruby?: string | null }) => {
          if (!attributes.ruby) return {};
          return { 'data-ruby': attributes.ruby };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-ruby]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const ruby = typeof HTMLAttributes['data-ruby'] === 'string' ? HTMLAttributes['data-ruby'] : '';
    return [
      'span',
      mergeAttributes(HTMLAttributes, { class: 'inline-flex flex-col items-center align-bottom' }),
      ['span', { class: 'text-2xs leading-none text-text-muted', contenteditable: 'false' }, ruby],
      ['span', 0],
    ];
  },
});
