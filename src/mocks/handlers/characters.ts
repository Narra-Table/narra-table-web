import { http, HttpResponse } from 'msw';
import type { CharacterCard } from '@/types/protocol';
import { characterCards, masks } from '../db';

export const characterHandlers = [
  // GET /api/masks/:maskId/cards
  http.get('*/api/masks/:maskId/cards', ({ params }) => {
    const cards = characterCards.filter((c) => c.maskId === params.maskId);
    return HttpResponse.json({ cards });
  }),

  // POST /api/masks/:maskId/cards
  http.post('*/api/masks/:maskId/cards', async ({ params, request }) => {
    const body = (await request.json()) as {
      name: string;
      attributes?: Record<string, unknown>;
      templateId?: string;
    };
    const now = new Date().toISOString();
    const newCard: CharacterCard = {
      id: `cc_${Date.now()}`,
      maskId: params.maskId as string,
      name: body.name,
      attributes: body.attributes ?? {},
      templateId: body.templateId,
      createdAt: now,
      updatedAt: now,
    };
    characterCards.push(newCard);
    const mask = masks.find((m) => m.maskId === params.maskId);
    mask?.characterCards.push(newCard.id);
    return HttpResponse.json(newCard, { status: 201 });
  }),

  // GET /api/masks/:maskId/cards/:cardId
  http.get('*/api/masks/:maskId/cards/:cardId', ({ params }) => {
    const card = characterCards.find((c) => c.id === params.cardId && c.maskId === params.maskId);
    if (!card) return HttpResponse.json({ error: 'Card not found' }, { status: 404 });
    return HttpResponse.json(card);
  }),

  // PUT /api/masks/:maskId/cards/:cardId
  http.put('*/api/masks/:maskId/cards/:cardId', async ({ params, request }) => {
    const card = characterCards.find((c) => c.id === params.cardId && c.maskId === params.maskId);
    if (!card) return HttpResponse.json({ error: 'Card not found' }, { status: 404 });
    const body = (await request.json()) as Partial<
      Pick<CharacterCard, 'name' | 'attributes' | 'templateId'>
    >;
    Object.assign(card, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json(card);
  }),

  // DELETE /api/masks/:maskId/cards/:cardId
  http.delete('*/api/masks/:maskId/cards/:cardId', ({ params }) => {
    const idx = characterCards.findIndex((c) => c.id === params.cardId);
    if (idx !== -1) characterCards.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
