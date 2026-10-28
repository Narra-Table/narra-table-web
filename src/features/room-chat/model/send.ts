import { mergeTextNodes, serializeRun } from './richText';
import type { OutgoingDraft, OutgoingVeil, StagedReply, TextRun } from './types';

export interface SendCommand {
  type: 'message.send';
  requestId: string;
  roomId: string;
  senderMaskId: string;
  messageType: 'chat' | 'command';
  content?: Record<string, unknown>[];
  raw?: string;
  command?: string;
  veil: { visibility: OutgoingVeil; revealOnSpaceClose: false };
}

export function commandName(raw: string): string {
  const body = raw.replace(/^[.。/]\s*/, '').trim();
  const token = body.split(/\s+/)[0];
  return token || raw;
}

function replyBlock(reply: StagedReply): Record<string, unknown> {
  return { type: 'reply', messageId: reply.messageId, preview: reply.preview };
}

function paragraphChildren(text: string, nodes: TextRun[] | undefined): Record<string, unknown>[] {
  const runs = mergeTextNodes(nodes?.length ? nodes : [{ type: 'text', text }]);
  return runs.map((node) => serializeRun(node));
}

export function buildSendCommand(input: {
  requestId: string;
  roomId: string;
  draft: OutgoingDraft;
}): SendCommand {
  const text = input.draft.text.trim();
  const veil = { visibility: input.draft.veilVisibility, revealOnSpaceClose: false as const };
  const base = {
    type: 'message.send' as const,
    requestId: input.requestId,
    roomId: input.roomId,
    senderMaskId: input.draft.maskId,
    veil,
  };
  if (text.startsWith('.')) {
    return {
      ...base,
      messageType: 'command',
      raw: text,
      command: commandName(text),
      content: input.draft.reply ? [replyBlock(input.draft.reply)] : undefined,
    };
  }
  return {
    ...base,
    messageType: 'chat',
    content: [
      ...(input.draft.reply ? [replyBlock(input.draft.reply)] : []),
      { type: 'paragraph', children: paragraphChildren(text, input.draft.nodes) },
    ],
  };
}
