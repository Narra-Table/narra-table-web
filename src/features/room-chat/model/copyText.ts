import type { StyledInline } from './richText';
import type { RoomBlock, RoomMessage } from './types';

function inlinePlain(child: StyledInline): string {
  if (child.type === 'mention') return child.displayText || '提及';
  if (child.type === 'face') return '[表情]';
  if (child.type === 'text') return child.text ?? '';
  return '';
}

export function blocksPlainText(blocks: RoomBlock[] | undefined): string {
  const parts: string[] = [];
  for (const block of blocks ?? []) {
    if (block.type !== 'paragraph') continue;
    const text = (block.children ?? []).map((child) => inlinePlain(child)).join('');
    if (text.trim()) parts.push(text);
  }
  return parts.join('\n');
}

export function messagePlainText(message: RoomMessage): string {
  if (message.deleted) return '此内容已删除';
  if (message.type === 'command') return (message.raw ?? '').trim();
  if (message.type === 'clue') {
    return [message.clue?.title, message.clue?.description]
      .filter((part) => part?.trim())
      .join('\n');
  }
  if (message.type === 'forward') return (message.forward?.title ?? '').trim();
  return blocksPlainText(message.content);
}
