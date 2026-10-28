import type { GithubComNarraTableBackendPkgProtocolInline } from '@/api/model/githubComNarraTableBackendPkgProtocolInline';
import type { RoomBlock, TextRun } from './types';

export interface ComposerMark {
  type: string;
  attrs?: { color?: string; background?: string; ruby?: string };
}

export interface ComposerNode {
  type?: string;
  text?: string;
  marks?: ComposerMark[];
  content?: ComposerNode[];
}

export const THEME_COLORS = ['accent', 'danger', 'warning', 'success', 'info'] as const;

export type ThemeColor = (typeof THEME_COLORS)[number];

export const THEME_TEXT_CLASS: Record<ThemeColor, string> = {
  accent: 'text-accent',
  danger: 'text-danger',
  warning: 'text-warning',
  success: 'text-success',
  info: 'text-info',
};

export const THEME_BG_CLASS: Record<ThemeColor, string> = {
  accent: 'bg-accent',
  danger: 'bg-danger',
  warning: 'bg-warning',
  success: 'bg-success',
  info: 'bg-info',
};

export function isThemeColor(value: string): value is ThemeColor {
  return (THEME_COLORS as readonly string[]).includes(value);
}

export function normalizeColor(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (isThemeColor(trimmed)) return trimmed;
  const match = /^#([0-9a-fA-F]{6})$/.exec(trimmed);
  if (!match?.[1]) return undefined;
  return `#${match[1].toLowerCase()}`;
}

export type StyledInline = GithubComNarraTableBackendPkgProtocolInline;

function sameStyle(left: TextRun, right: TextRun): boolean {
  return (
    Boolean(left.bold) === Boolean(right.bold) &&
    Boolean(left.italic) === Boolean(right.italic) &&
    Boolean(left.underline) === Boolean(right.underline) &&
    Boolean(left.strikethrough) === Boolean(right.strikethrough) &&
    (left.color ?? '') === (right.color ?? '') &&
    (left.background ?? '') === (right.background ?? '')
  );
}

function copyRun(node: TextRun): TextRun {
  const next: TextRun = { type: 'text', text: node.text };
  if (node.bold) next.bold = true;
  if (node.italic) next.italic = true;
  if (node.underline) next.underline = true;
  if (node.strikethrough) next.strikethrough = true;
  if (node.color) next.color = node.color;
  if (node.background) next.background = node.background;
  if (node.ruby) next.ruby = node.ruby;
  return next;
}

export function mergeTextNodes(nodes: readonly TextRun[]): TextRun[] {
  const merged: TextRun[] = [];
  for (const node of nodes) {
    if (!node.text && !node.ruby) continue;
    const previous = merged.at(-1);
    if (previous && !previous.ruby && !node.ruby && sameStyle(previous, node)) {
      previous.text += node.text;
      continue;
    }
    merged.push(copyRun(node));
  }
  return merged;
}

export function trimTextNodes(nodes: readonly TextRun[]): TextRun[] {
  const next = nodes.map((node) => copyRun(node));
  const blank = (node: TextRun | undefined) => Boolean(node && !node.ruby && !node.text.trim());
  while (blank(next[0])) next.shift();
  while (blank(next.at(-1))) next.pop();
  const first = next[0];
  if (first) first.text = first.text.trimStart();
  const last = next.at(-1);
  if (last) last.text = last.text.trimEnd();
  return next.filter((node) => node.text.length > 0 || Boolean(node.ruby));
}

function marksOf(node: ComposerNode): Partial<TextRun> {
  const marks: Partial<TextRun> = {};
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') marks.bold = true;
    if (mark.type === 'italic') marks.italic = true;
    if (mark.type === 'underline') marks.underline = true;
    if (mark.type === 'strike') marks.strikethrough = true;
    if (mark.type === 'textColor') {
      const color = normalizeColor(
        typeof mark.attrs?.color === 'string' ? mark.attrs.color : undefined,
      );
      if (color) marks.color = color;
    }
    if (mark.type === 'textBackground') {
      const background = normalizeColor(
        typeof mark.attrs?.background === 'string' ? mark.attrs.background : undefined,
      );
      if (background) marks.background = background;
    }
    if (mark.type === 'ruby') {
      const ruby = typeof mark.attrs?.ruby === 'string' ? mark.attrs.ruby.trim() : '';
      if (ruby) marks.ruby = ruby;
    }
  }
  return marks;
}

function pushText(nodes: TextRun[], text: string, marks: Partial<TextRun>) {
  if (!text && !marks.ruby) return;
  nodes.push(copyRun({ type: 'text', text, ...marks }));
}

function collectInline(node: ComposerNode, nodes: TextRun[]) {
  if (node.type === 'text') {
    pushText(nodes, node.text ?? '', marksOf(node));
    return;
  }
  if (node.type === 'hardBreak') {
    pushText(nodes, '\n', {});
    return;
  }
  for (const child of node.content ?? []) collectInline(child, nodes);
}

export interface ComposerExport {
  plain: string;
  nodes: TextRun[];
  command: boolean;
}

export function exportComposerDoc(doc: ComposerNode): ComposerExport {
  const paragraphs = (doc.content ?? []).filter((node) => node.type === 'paragraph');
  const collected: TextRun[] = [];
  paragraphs.forEach((paragraph, index) => {
    if (index > 0) pushText(collected, '\n', {});
    collectInline(paragraph, collected);
  });
  const nodes = trimTextNodes(mergeTextNodes(collected));
  const plain = nodes
    .map((node) => node.text)
    .join('')
    .trim();
  return { plain, nodes, command: plain.startsWith('.') };
}

function marksFor(node: TextRun): ComposerMark[] | undefined {
  const marks: ComposerMark[] = [];
  if (node.bold) marks.push({ type: 'bold' });
  if (node.italic) marks.push({ type: 'italic' });
  if (node.underline) marks.push({ type: 'underline' });
  if (node.strikethrough) marks.push({ type: 'strike' });
  if (node.color) marks.push({ type: 'textColor', attrs: { color: node.color } });
  if (node.background)
    marks.push({ type: 'textBackground', attrs: { background: node.background } });
  if (node.ruby) marks.push({ type: 'ruby', attrs: { ruby: node.ruby } });
  return marks.length ? marks : undefined;
}

export function textNodesToDoc(nodes: readonly TextRun[]): ComposerNode {
  const content: ComposerNode[] = [];
  for (const node of nodes) {
    const parts = node.text.split('\n');
    parts.forEach((part, index) => {
      if (index > 0) content.push({ type: 'hardBreak' });
      if (!part) return;
      const marks = marksFor(node);
      content.push(marks ? { type: 'text', text: part, marks } : { type: 'text', text: part });
    });
  }
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content }],
  };
}

export function textNodesFromBlocks(blocks: RoomBlock[] | undefined): TextRun[] {
  const nodes: TextRun[] = [];
  for (const block of blocks ?? []) {
    if (block.type !== 'paragraph') continue;
    if (nodes.length) nodes.push({ type: 'text', text: '\n' });
    for (const child of block.children ?? []) {
      const styled = child as StyledInline;
      if (styled.type !== 'text') continue;
      const color = normalizeColor(styled.color);
      const background = normalizeColor(styled.background);
      const ruby = styled.ruby?.trim();
      nodes.push(
        copyRun({
          type: 'text',
          text: styled.text ?? '',
          bold: styled.bold,
          italic: styled.italic,
          underline: styled.underline,
          strikethrough: styled.strikethrough,
          color,
          background,
          ruby: ruby || undefined,
        }),
      );
    }
  }
  return trimTextNodes(mergeTextNodes(nodes));
}

export function serializeRun(node: TextRun): Record<string, unknown> {
  const out: Record<string, unknown> = { type: 'text', text: node.text };
  if (node.bold) out.bold = true;
  if (node.italic) out.italic = true;
  if (node.underline) out.underline = true;
  if (node.strikethrough) out.strikethrough = true;
  if (node.color) out.color = node.color;
  if (node.background) out.background = node.background;
  if (node.ruby) out.ruby = node.ruby;
  return out;
}

export function replaceChatParagraph(
  blocks: RoomBlock[] | undefined,
  nodes: readonly TextRun[],
): Record<string, unknown>[] {
  const paragraph = {
    type: 'paragraph',
    children: mergeTextNodes(nodes).map((node) => serializeRun(node)),
  };
  const next: Record<string, unknown>[] = [];
  let inserted = false;
  for (const block of blocks ?? []) {
    if (block.type === 'paragraph') {
      if (!inserted) {
        next.push(paragraph);
        inserted = true;
      }
      continue;
    }
    next.push({ ...block });
  }
  if (!inserted) next.push(paragraph);
  return next;
}
