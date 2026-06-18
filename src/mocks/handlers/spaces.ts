import type { SpaceSummary, SpaceDetail, SpaceMember } from '@narratable/protocol';
import { http, HttpResponse } from 'msw';
import { CURRENT_USER_ID, spaces, rooms, messages } from '../db';

function toSummary(space: SpaceDetail): SpaceSummary {
  const myMember = space.members.find((m) => m.userId === CURRENT_USER_ID);
  const lastActive =
    rooms
      .filter((r) => r.spaceId === space.spaceId)
      .map((r) => r.lastActiveAt)
      .sort()
      .at(-1) ?? space.updatedAt;

  return {
    spaceId: space.spaceId,
    name: space.name,
    description: space.description,
    avatar: space.avatar,
    ownerId: space.ownerId,
    memberCount: space.members.length,
    status: space.status,
    myRole: myMember?.role ?? 'ob',
    createdAt: space.createdAt,
    lastActiveAt: lastActive,
  };
}

export const spaceHandlers = [
  // GET /api/spaces
  http.get('*/api/spaces', () => {
    return HttpResponse.json({ spaces: spaces.map(toSummary) });
  }),

  // POST /api/spaces
  http.post('*/api/spaces', async ({ request }) => {
    const body = (await request.json()) as { name: string; description?: string };
    const now = new Date().toISOString();
    const newSpace: SpaceDetail = {
      spaceId: `sp_${Date.now()}`,
      name: body.name,
      description: body.description ?? '',
      ownerId: CURRENT_USER_ID,
      members: [{ userId: CURRENT_USER_ID, role: 'gm', displayName: '爱丽丝', joinedAt: now }],
      rooms: [],
      masks: [],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    spaces.push(newSpace);
    return HttpResponse.json(newSpace, { status: 201 });
  }),

  // GET /api/spaces/:spaceId
  http.get('*/api/spaces/:spaceId', ({ params }) => {
    const space = spaces.find((s) => s.spaceId === params.spaceId);
    if (!space) return HttpResponse.json({ error: 'Space not found' }, { status: 404 });
    return HttpResponse.json(space);
  }),

  // PATCH /api/spaces/:spaceId
  http.patch('*/api/spaces/:spaceId', async ({ params, request }) => {
    const space = spaces.find((s) => s.spaceId === params.spaceId);
    if (!space) return HttpResponse.json({ error: 'Space not found' }, { status: 404 });
    const body = (await request.json()) as Partial<
      Pick<SpaceDetail, 'name' | 'description' | 'status'>
    >;
    Object.assign(space, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json(space);
  }),

  // DELETE /api/spaces/:spaceId
  http.delete('*/api/spaces/:spaceId', ({ params }) => {
    const idx = spaces.findIndex((s) => s.spaceId === params.spaceId);
    if (idx === -1) return HttpResponse.json({ error: 'Space not found' }, { status: 404 });
    spaces.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/spaces/:spaceId/members
  http.post('*/api/spaces/:spaceId/members', async ({ params, request }) => {
    const space = spaces.find((s) => s.spaceId === params.spaceId);
    if (!space) return HttpResponse.json({ error: 'Space not found' }, { status: 404 });
    const body = (await request.json()) as { userId: string; role: SpaceMember['role'] };
    const member: SpaceMember = {
      userId: body.userId,
      role: body.role,
      displayName: body.userId,
      joinedAt: new Date().toISOString(),
    };
    space.members.push(member);
    return HttpResponse.json(member, { status: 201 });
  }),

  // PATCH /api/spaces/:spaceId/members/:userId/role
  http.patch('*/api/spaces/:spaceId/members/:userId/role', async ({ params, request }) => {
    const space = spaces.find((s) => s.spaceId === params.spaceId);
    if (!space) return HttpResponse.json({ error: 'Space not found' }, { status: 404 });
    const member = space.members.find((m) => m.userId === params.userId);
    if (!member) return HttpResponse.json({ error: 'Member not found' }, { status: 404 });
    const body = (await request.json()) as { role: SpaceMember['role'] };
    member.role = body.role;
    return HttpResponse.json(member);
  }),

  // DELETE /api/spaces/:spaceId/members/:userId
  http.delete('*/api/spaces/:spaceId/members/:userId', ({ params }) => {
    const space = spaces.find((s) => s.spaceId === params.spaceId);
    if (!space) return HttpResponse.json({ error: 'Space not found' }, { status: 404 });
    const idx = space.members.findIndex((m) => m.userId === params.userId);
    if (idx !== -1) space.members.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/spaces/:spaceId/reveal-all-veils
  http.post('*/api/spaces/:spaceId/reveal-all-veils', ({ params }) => {
    const spaceMessages = messages.filter((m) => m.spaceId === params.spaceId);
    const revealed = spaceMessages.filter((m) => m.veil.revealOnSpaceClose);
    revealed.forEach((m) => {
      m.veil = { ...m.veil, visibility: 'all', revealOnSpaceClose: false };
    });
    return HttpResponse.json({
      messageIds: revealed.map((m) => m.messageId),
      count: revealed.length,
    });
  }),
];
