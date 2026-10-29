import { describe, expect, it } from 'vitest';
import { buildSendCommand } from './send';

const draft = { text: '我推开门。', maskId: 'mask-1', veilVisibility: 'all' as const };

describe('buildSendCommand', () => {
  it('sends ordinary text as a chat paragraph', () => {
    const command = buildSendCommand({ requestId: 'req-1', roomId: 'room-1', draft });
    expect(command.messageType).toBe('chat');
    expect(command.content).toEqual([
      { type: 'paragraph', children: [{ type: 'text', text: '我推开门。' }] },
    ]);
  });

  it('sends a leading dot as a command raw string', () => {
    const command = buildSendCommand({
      requestId: 'req-2',
      roomId: 'room-1',
      draft: { ...draft, text: '  .r 1d20  ' },
    });
    expect(command).toMatchObject({ messageType: 'command', raw: '.r 1d20', command: 'r' });
  });

  it('sends styled nodes and drops them when the text is a command', () => {
    const styled = buildSendCommand({
      requestId: 'req-style',
      roomId: 'room-1',
      draft: {
        ...draft,
        text: '克苏鲁',
        nodes: [{ type: 'text', text: '克苏鲁', bold: true, color: '#9a3412', ruby: 'Cthulhu' }],
      },
    });
    expect(styled.content).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: '克苏鲁', bold: true, color: '#9a3412', ruby: 'Cthulhu' }],
      },
    ]);

    const command = buildSendCommand({
      requestId: 'req-command',
      roomId: 'room-1',
      draft: {
        ...draft,
        text: '.look',
        nodes: [{ type: 'text', text: '.look', bold: true, ruby: 'Cthulhu' }],
      },
    });
    expect(command).toMatchObject({ messageType: 'command', raw: '.look' });
    expect(JSON.stringify(command)).not.toContain('ruby');
    expect(JSON.stringify(command)).not.toContain('bold');
  });

  it('puts a reply preview on the outgoing chat', () => {
    const command = buildSendCommand({
      requestId: 'req-3',
      roomId: 'room-1',
      draft: {
        ...draft,
        reply: { messageId: 'm1', preview: { senderName: '旁白', textSnippet: '此内容已删除' } },
      },
    });
    expect(command.content?.[0]).toMatchObject({ type: 'reply', messageId: 'm1' });
  });
});
