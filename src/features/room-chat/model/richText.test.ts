import { describe, expect, it } from 'vitest';
import { exportComposerDoc, mergeTextNodes, textNodesToDoc } from './richText';

describe('mergeTextNodes', () => {
  it('keeps a different color or style in its own node', () => {
    expect(
      mergeTextNodes([
        { type: 'text', text: '甲', color: 'accent' },
        { type: 'text', text: '乙', color: 'danger' },
        { type: 'text', text: '丙', bold: true },
        { type: 'text', text: '丁' },
      ]),
    ).toEqual([
      { type: 'text', text: '甲', color: 'accent' },
      { type: 'text', text: '乙', color: 'danger' },
      { type: 'text', text: '丙', bold: true },
      { type: 'text', text: '丁' },
    ]);
  });

  it('does not merge a ruby node with the neighbor', () => {
    expect(
      mergeTextNodes([
        { type: 'text', text: '克', ruby: 'Cthulhu', bold: true },
        { type: 'text', text: '苏', ruby: 'Cthulhu', bold: true },
      ]),
    ).toHaveLength(2);
  });

  it('merges adjacent runs that share style and have no ruby', () => {
    expect(
      mergeTextNodes([
        { type: 'text', text: '推', bold: true, color: 'info' },
        { type: 'text', text: '门', bold: true, color: 'info' },
      ]),
    ).toEqual([{ type: 'text', text: '推门', bold: true, color: 'info' }]);
  });
});

describe('exportComposerDoc', () => {
  it('exports one paragraph with bold, lowercase color, and ruby', () => {
    const exported = exportComposerDoc({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '克苏鲁',
              marks: [
                { type: 'bold' },
                { type: 'textColor', attrs: { color: '#9A3412' } },
                { type: 'ruby', attrs: { ruby: 'Cthulhu' } },
              ],
            },
          ],
        },
      ],
    });
    expect(exported.command).toBe(false);
    expect(exported.nodes).toEqual([
      { type: 'text', text: '克苏鲁', bold: true, color: '#9a3412', ruby: 'Cthulhu' },
    ]);
  });

  it('treats a leading dot as a command', () => {
    const exported = exportComposerDoc({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '  .look 门 ', marks: [{ type: 'bold' }] }],
        },
      ],
    });
    expect(exported).toMatchObject({ command: true, plain: '.look 门' });
  });

  it('keeps asterisks as characters', () => {
    const exported = exportComposerDoc({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '*推开门*' }] }],
    });
    expect(exported.nodes).toEqual([{ type: 'text', text: '*推开门*' }]);
    expect(exported.nodes[0]?.italic).toBeUndefined();
  });

  it('reloads styled nodes into a single paragraph document', () => {
    const doc = textNodesToDoc([
      { type: 'text', text: '甲\n乙', bold: true, color: 'warning', ruby: 'jia' },
    ]);
    expect(doc.content?.[0]?.content?.map((node) => node.type)).toEqual([
      'text',
      'hardBreak',
      'text',
    ]);
    expect(exportComposerDoc(doc).nodes).toEqual([
      { type: 'text', text: '甲', bold: true, color: 'warning', ruby: 'jia' },
      { type: 'text', text: '\n' },
      { type: 'text', text: '乙', bold: true, color: 'warning', ruby: 'jia' },
    ]);
  });
});
