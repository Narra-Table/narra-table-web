import { Mark, mergeAttributes } from '@tiptap/core';
import { readableTextColor } from '../model/contrast';
import { THEME_BG_CLASS, THEME_TEXT_CLASS, isThemeColor, normalizeColor } from '../model/richText';

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

export const TextBackground = Mark.create({
  name: 'textBackground',

  addAttributes() {
    return {
      background: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-background'),
        renderHTML: (attributes: { background?: string | null }) => {
          if (!attributes.background) return {};
          return { 'data-background': attributes.background };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-background]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const raw =
      typeof HTMLAttributes['data-background'] === 'string'
        ? HTMLAttributes['data-background']
        : '';
    const background = normalizeColor(raw);
    if (background && isThemeColor(background)) {
      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          class: cnBg(THEME_BG_CLASS[background]),
        }),
        0,
      ];
    }
    if (background) {
      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          class: 'rounded-sm px-0.5',
          // 底色是自定义色值时，没有显式文字颜色的文字在这里取一个可读色。
          // 外层的文字颜色 mark 会覆盖它，所以显式颜色不受影响。
          style: `background-color: ${background}; color: ${readableTextColor(background)}`,
        }),
        0,
      ];
    }
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

function cnBg(token: string) {
  return `${token} rounded-sm px-0.5`;
}

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
    // 注音只放在伪元素上。写进正文节点会占文档位置，选区映射会把末字拆出标注。
    return ['span', mergeAttributes(HTMLAttributes, { class: 'composer-ruby' }), 0];
  },
});
