import type { RoomBlock, RoomMessage } from './types';

export function blockPlainText(blocks: RoomBlock[] | undefined): string {
  if (!blocks) return '';
  const parts: string[] = [];
  for (const block of blocks) {
    if (block.type === 'paragraph') {
      const text = (block.children ?? [])
        .map((child) => child.text || child.displayText || child.faceId || '')
        .join('');
      if (text.trim()) parts.push(text.trim());
    } else if (block.type === 'reply' && block.preview?.textSnippet) {
      parts.push(block.preview.textSnippet);
    } else if (block.type === 'divider' && block.label?.trim()) {
      parts.push(block.label.trim());
    } else if (block.type === 'table' && block.caption?.trim()) {
      parts.push(block.caption.trim());
    }
  }
  return parts.join('\n');
}

export function messageExcerpt(message: RoomMessage): string {
  if (message.deleted) return '此内容已删除';
  if (message.type === 'command') return (message.raw ?? '').trim();
  if (message.type === 'clue') return (message.clue?.title ?? '').trim();
  if (message.type === 'forward') return (message.forward?.title ?? '').trim();
  if (message.type === 'system') return blockPlainText(message.content);
  return blockPlainText(message.content);
}

export function firstLine(text: string): string {
  const line = text.split('\n').find((part) => part.trim()) ?? '';
  return line.trim();
}

export function veilMarks(veil: RoomMessage['veil']): string[] {
  const marks: string[] = [];
  if (veil?.visibility === 'gm_only') marks.push('仅 GM');
  if (veil?.visibility === 'custom') marks.push('指定可见');
  if (veil?.visibility === 'gm_and_custom') marks.push('主持与指定成员');
  if (veil?.revealOnSpaceClose) marks.push('结团后公开');
  return marks;
}

export function formatSendTime(value: string | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function maskLabel(
  maskNames: ReadonlyMap<string, string>,
  maskId: string | undefined,
): string {
  if (!maskId) return '未知面具';
  return maskNames.get(maskId) ?? maskId;
}
