import { getSchema } from '@tiptap/core';
import { describe, expect, it } from 'vitest';
import { RubyMark, TextBackground } from './marks';
import { createComposerExtensions } from './schema';

const renderRuby = RubyMark.config.renderHTML as unknown as (props: {
  HTMLAttributes: Record<string, unknown>;
}) => unknown;

const renderBackground = TextBackground.config.renderHTML as unknown as (props: {
  HTMLAttributes: Record<string, unknown>;
}) => unknown;

describe('RubyMark', () => {
  it('keeps the annotation out of the document text', () => {
    const spec = renderRuby({ HTMLAttributes: { 'data-ruby': 'Cthulhu' } });
    expect(spec).toEqual([
      'span',
      expect.objectContaining({ class: 'composer-ruby', 'data-ruby': 'Cthulhu' }),
      0,
    ]);
  });
});

describe('TextBackground', () => {
  it('gives a light highlight a dark default text color', () => {
    const spec = renderBackground({ HTMLAttributes: { 'data-background': '#fef08a' } }) as [
      string,
      Record<string, string>,
      number,
    ];
    expect(spec[1].style).toContain('background-color: #fef08a');
    expect(spec[1].style).toContain('color: #15110d');
  });

  it('gives a dark fill a light default text color', () => {
    const spec = renderBackground({ HTMLAttributes: { 'data-background': '#1f2937' } }) as [
      string,
      Record<string, string>,
      number,
    ];
    expect(spec[1].style).toContain('background-color: #1f2937');
    expect(spec[1].style).toContain('color: #f7f7f7');
  });
});

describe('composer mark order', () => {
  it('nests the background mark outside the text color mark', () => {
    const marks = Object.keys(getSchema(createComposerExtensions()).marks);
    expect(marks.indexOf('textBackground')).toBeLessThan(marks.indexOf('textColor'));
  });
});
