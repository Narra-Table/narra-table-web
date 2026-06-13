import { http, HttpResponse } from 'msw';
import type { Room, RoomSummary } from '@/types/protocol';
import { rooms, messages, spaces } from '../db';

function toSummary(room: Room): RoomSummary {
  const roomMessages = messages
    .filter((m) => m.roomId === room.roomId && !m.deleted)
    .sort((a, b) => a.sendTime.localeCompare(b.sendTime));
  const last = roomMessages.at(-1);

  return {
    roomId: room.roomId,
    spaceId: room.spaceId,
    name: room.name,
    description: room.description,
    type: room.type,
    sortOrder: room.sortOrder,
    hasJoinCode: room.type === 'private',
    isArchived: room.isArchived,
    lastMessage: last
      ? {
          senderName: last.sender.maskId,
          textSnippet: extractSnippet(last),
          sendTime: last.sendTime,
        }
      : undefined,
    unreadCount: 0,
    memberCount: spaces.find((s) => s.spaceId === room.spaceId)?.members.length ?? 0,
    lastActiveAt: room.lastActiveAt,
  };
}

function extractSnippet(msg: (typeof messages)[number]): string {
  if (msg.type === 'command') return msg.raw ?? msg.command ?? '';
  if (msg.type === 'clue') return msg.clue?.title ?? '';
  if (msg.type === 'system')
    return msg.content?.[0]?.type === 'paragraph'
      ? ((msg.content[0].children[0] as { text?: string }).text ?? '')
      : '';
  const para = msg.content?.find((b) => b.type === 'paragraph');
  if (!para || para.type !== 'paragraph') return '';
  return para.children
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('')
    .slice(0, 60);
}

export const roomHandlers = [
  // GET /api/spaces/:spaceId/rooms
  http.get('*/api/spaces/:spaceId/rooms', ({ params }) => {
    const spaceRooms = rooms
      .filter((r) => r.spaceId === params.spaceId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return HttpResponse.json({ rooms: spaceRooms.map(toSummary) });
  }),

  // POST /api/spaces/:spaceId/rooms
  http.post('*/api/spaces/:spaceId/rooms', async ({ params, request }) => {
    const body = (await request.json()) as {
      name: string;
      type: Room['type'];
      description?: string;
      sortOrder?: number;
      visibleUserIds?: string[];
    };
    const now = new Date().toISOString();
    const newRoom: Room = {
      roomId: `room_${Date.now()}`,
      spaceId: params.spaceId as string,
      name: body.name,
      description: body.description ?? '',
      type: body.type,
      sortOrder: body.sortOrder ?? rooms.filter((r) => r.spaceId === params.spaceId).length,
      visibleMemberIds: body.visibleUserIds,
      isArchived: false,
      createdAt: now,
      lastActiveAt: now,
    };
    rooms.push(newRoom);
    const space = spaces.find((s) => s.spaceId === params.spaceId);
    space?.rooms.push(newRoom.roomId);
    return HttpResponse.json({ room: newRoom, joinCode: '000000' }, { status: 201 });
  }),

  // GET /api/spaces/:spaceId/rooms/:roomId
  http.get('*/api/spaces/:spaceId/rooms/:roomId', ({ params }) => {
    const room = rooms.find((r) => r.roomId === params.roomId && r.spaceId === params.spaceId);
    if (!room) return HttpResponse.json({ error: 'Room not found' }, { status: 404 });
    return HttpResponse.json(room);
  }),

  // PATCH /api/spaces/:spaceId/rooms/:roomId
  http.patch('*/api/spaces/:spaceId/rooms/:roomId', async ({ params, request }) => {
    const room = rooms.find((r) => r.roomId === params.roomId);
    if (!room) return HttpResponse.json({ error: 'Room not found' }, { status: 404 });
    const body = (await request.json()) as Partial<
      Pick<Room, 'name' | 'description' | 'sortOrder' | 'visibleMemberIds'>
    >;
    Object.assign(room, body);
    return HttpResponse.json(room);
  }),

  // DELETE /api/spaces/:spaceId/rooms/:roomId
  http.delete('*/api/spaces/:spaceId/rooms/:roomId', ({ params }) => {
    const idx = rooms.findIndex((r) => r.roomId === params.roomId);
    if (idx !== -1) rooms.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/spaces/:spaceId/rooms/:roomId/join
  http.post('*/api/spaces/:spaceId/rooms/:roomId/join', ({ params }) => {
    const memberCount = spaces.find((s) => s.spaceId === params.spaceId)?.members.length ?? 0;
    return HttpResponse.json({
      roomId: params.roomId,
      memberCount,
      joinedAt: new Date().toISOString(),
    });
  }),

  // POST /api/spaces/:spaceId/rooms/:roomId/leave
  http.post('*/api/spaces/:spaceId/rooms/:roomId/leave', ({ params }) => {
    const memberCount = spaces.find((s) => s.spaceId === params.spaceId)?.members.length ?? 0;
    return HttpResponse.json({ roomId: params.roomId, memberCount });
  }),

  // POST /api/spaces/:spaceId/rooms/:roomId/regenerate-code
  http.post('*/api/spaces/:spaceId/rooms/:roomId/regenerate-code', () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    return HttpResponse.json({ joinCode: code });
  }),
];
