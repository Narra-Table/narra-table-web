import type { Resource } from '@narratable/protocol';
import { http, HttpResponse } from 'msw';
import { resources } from '../db';

export const resourceHandlers = [
  // GET /api/spaces/:spaceId/resources
  http.get('*/api/spaces/:spaceId/resources', ({ params, request }) => {
    const url = new URL(request.url);
    const roomId = url.searchParams.get('roomId');
    const kind = url.searchParams.get('kind');

    let spaceResources = resources.filter((r) => r.spaceId === params.spaceId);
    if (roomId) spaceResources = spaceResources.filter((r) => r.roomId === roomId);
    if (kind) spaceResources = spaceResources.filter((r) => r.kind === kind);

    return HttpResponse.json({ resources: spaceResources });
  }),

  // POST /api/spaces/:spaceId/resources
  http.post('*/api/spaces/:spaceId/resources', async ({ params, request }) => {
    const body = (await request.json()) as {
      name: string;
      kind: Resource['kind'];
      uri: string;
      roomId?: string;
      messageId?: string;
      mimeType?: string;
      sizeBytes?: number;
      metadata?: Record<string, unknown>;
    };
    const now = new Date().toISOString();
    const newResource: Resource = {
      resourceId: `res_${Date.now()}`,
      spaceId: params.spaceId as string,
      name: body.name,
      kind: body.kind,
      uri: body.uri,
      roomId: body.roomId,
      messageId: body.messageId,
      mimeType: body.mimeType ?? 'application/octet-stream',
      sizeBytes: body.sizeBytes ?? 0,
      metadata: body.metadata,
      uploadedBy: 'user_alice',
      createdAt: now,
      updatedAt: now,
    };
    resources.push(newResource);
    return HttpResponse.json(newResource, { status: 201 });
  }),

  // GET /api/spaces/:spaceId/resources/:resourceId
  http.get('*/api/spaces/:spaceId/resources/:resourceId', ({ params }) => {
    const resource = resources.find(
      (r) => r.resourceId === params.resourceId && r.spaceId === params.spaceId,
    );
    if (!resource) return HttpResponse.json({ error: 'Resource not found' }, { status: 404 });
    return HttpResponse.json(resource);
  }),

  // DELETE /api/spaces/:spaceId/resources/:resourceId
  http.delete('*/api/spaces/:spaceId/resources/:resourceId', ({ params }) => {
    const idx = resources.findIndex(
      (r) => r.resourceId === params.resourceId && r.spaceId === params.spaceId,
    );
    if (idx !== -1) resources.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
