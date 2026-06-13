import { http, HttpResponse } from 'msw';
import type { Mask } from '@/types/protocol';
import { masks, spaces } from '../db';

export const maskHandlers = [
  // GET /api/spaces/:spaceId/masks
  http.get('*/api/spaces/:spaceId/masks', ({ params }) => {
    const spaceMasks = masks.filter((m) => m.spaceId === params.spaceId);
    return HttpResponse.json({ masks: spaceMasks });
  }),

  // POST /api/spaces/:spaceId/masks
  http.post('*/api/spaces/:spaceId/masks', async ({ params, request }) => {
    const body = (await request.json()) as {
      name: string;
      type: Mask['type'];
      avatars: Record<string, string>;
      currentAvatarId: string;
      defaultAvatarId: string;
    };
    const now = new Date().toISOString();
    const newMask: Mask = {
      maskId: `mask_${Date.now()}`,
      spaceId: params.spaceId as string,
      name: body.name,
      avatars: body.avatars,
      currentAvatarId: body.currentAvatarId,
      defaultAvatarId: body.defaultAvatarId,
      type: body.type,
      characterCards: [],
      userIds: [],
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };
    masks.push(newMask);
    const space = spaces.find((s) => s.spaceId === params.spaceId);
    space?.masks.push(newMask.maskId);
    return HttpResponse.json(newMask, { status: 201 });
  }),

  // GET /api/spaces/:spaceId/masks/:maskId
  http.get('*/api/spaces/:spaceId/masks/:maskId', ({ params }) => {
    const mask = masks.find((m) => m.maskId === params.maskId && m.spaceId === params.spaceId);
    if (!mask) return HttpResponse.json({ error: 'Mask not found' }, { status: 404 });
    return HttpResponse.json(mask);
  }),

  // PATCH /api/spaces/:spaceId/masks/:maskId
  http.patch('*/api/spaces/:spaceId/masks/:maskId', async ({ params, request }) => {
    const mask = masks.find((m) => m.maskId === params.maskId);
    if (!mask) return HttpResponse.json({ error: 'Mask not found' }, { status: 404 });
    const body = (await request.json()) as Partial<
      Pick<Mask, 'name' | 'avatars' | 'currentAvatarId' | 'defaultAvatarId' | 'userIds'>
    >;
    Object.assign(mask, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json(mask);
  }),

  // DELETE /api/spaces/:spaceId/masks/:maskId
  http.delete('*/api/spaces/:spaceId/masks/:maskId', ({ params }) => {
    const idx = masks.findIndex((m) => m.maskId === params.maskId);
    if (idx !== -1) masks.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
