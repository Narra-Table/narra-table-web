import { http, HttpResponse } from 'msw';
import type { Message, MessageBlock, Veil, VeilVisibility } from '@/types/protocol';
import { messages } from '../db';

export const messageHandlers = [
  // GET /api/spaces/:spaceId/rooms/:roomId/messages
  http.get('*/api/spaces/:spaceId/rooms/:roomId/messages', ({ params, request }) => {
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    const limit = Number(url.searchParams.get('limit') ?? '20');
    const sort = (url.searchParams.get('sort') ?? 'asc') as 'asc' | 'desc';
    const pinnedOnly = url.searchParams.get('pinnedOnly') === 'true';
    const maskId = url.searchParams.get('maskId');

    let roomMessages = messages.filter(
      (m) => m.roomId === params.roomId && m.spaceId === params.spaceId && !m.deleted,
    );

    if (pinnedOnly) roomMessages = roomMessages.filter((m) => m.pinned);
    if (maskId) roomMessages = roomMessages.filter((m) => m.sender.maskId === maskId);

    roomMessages.sort((a, b) =>
      sort === 'asc' ? a.sendTime.localeCompare(b.sendTime) : b.sendTime.localeCompare(a.sendTime),
    );

    let startIdx = 0;
    if (cursor) {
      const idx = roomMessages.findIndex((m) => m.messageId === cursor);
      if (idx !== -1) startIdx = idx + 1;
    }

    const page = roomMessages.slice(startIdx, startIdx + limit);
    const hasMore = startIdx + limit < roomMessages.length;
    const nextCursor = hasMore ? (page.at(-1)?.messageId ?? null) : null;

    return HttpResponse.json({ messages: page, nextCursor, hasMore });
  }),

  // PATCH /api/messages/:messageId
  http.patch('*/api/messages/:messageId', async ({ params, request }) => {
    const msg = messages.find((m) => m.messageId === params.messageId);
    if (!msg) return HttpResponse.json({ error: 'Message not found' }, { status: 404 });
    const body = (await request.json()) as {
      content?: MessageBlock[];
      clue?: Partial<NonNullable<Message['clue']>>;
    };
    msg.editHistory.push({
      editTime: new Date().toISOString(),
      previousRaw: msg.content ?? msg.clue,
      editBy: msg.sender.userId,
    });
    if (body.content !== undefined) msg.content = body.content;
    if (body.clue !== undefined && msg.clue) Object.assign(msg.clue, body.clue);
    msg.updateTime = new Date().toISOString();
    return HttpResponse.json(msg);
  }),

  // DELETE /api/messages/:messageId
  http.delete('*/api/messages/:messageId', ({ params }) => {
    const msg = messages.find((m) => m.messageId === params.messageId);
    if (msg) msg.deleted = true;
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/messages/:messageId/pin
  http.post('*/api/messages/:messageId/pin', async ({ params, request }) => {
    const msg = messages.find((m) => m.messageId === params.messageId);
    if (!msg) return HttpResponse.json({ error: 'Message not found' }, { status: 404 });
    const body = (await request.json()) as { pinned: boolean };
    msg.pinned = body.pinned;
    return HttpResponse.json(msg);
  }),

  // POST /api/messages/:messageId/fold
  http.post('*/api/messages/:messageId/fold', async ({ params, request }) => {
    const msg = messages.find((m) => m.messageId === params.messageId);
    if (!msg) return HttpResponse.json({ error: 'Message not found' }, { status: 404 });
    const body = (await request.json()) as { folded: boolean };
    msg.folded = body.folded;
    return HttpResponse.json(msg);
  }),

  // PATCH /api/messages/:messageId/veil
  http.patch('*/api/messages/:messageId/veil', async ({ params, request }) => {
    const msg = messages.find((m) => m.messageId === params.messageId);
    if (!msg) return HttpResponse.json({ error: 'Message not found' }, { status: 404 });
    const body = (await request.json()) as { visibility: VeilVisibility; visibleTo?: string[] };
    const newVeil: Veil = {
      visibility: body.visibility,
      visibleTo: body.visibleTo,
      revealOnSpaceClose: msg.veil.revealOnSpaceClose,
    };
    msg.veil = newVeil;
    return HttpResponse.json(msg);
  }),
];
