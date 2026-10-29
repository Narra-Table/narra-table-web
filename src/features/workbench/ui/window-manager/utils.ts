export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function shortTitle(title: string): string {
  if (typeof Intl.Segmenter !== 'function') return Array.from(title).slice(0, 2).join('');
  const segments = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(title);
  return Array.from(segments, ({ segment }) => segment)
    .slice(0, 2)
    .join('');
}
