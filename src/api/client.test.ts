import { afterEach, expect, test, vi } from 'vitest';
import type { ApiError } from './client';
import { apiFetch } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('parses json responses', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ name: 'Narra' })),
  );

  await expect(apiFetch<{ name: string }>('/api/spaces')).resolves.toEqual({ name: 'Narra' });
});

test('handles empty responses', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(null, { status: 204 })),
  );

  await expect(apiFetch<void>('/api/spaces/1', { method: 'DELETE' })).resolves.toBeUndefined();
});

test('throws api errors with parsed body', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ message: 'Space not found' }, { status: 404 })),
  );

  await expect(apiFetch('/api/spaces/missing')).rejects.toMatchObject({
    name: 'ApiError',
    message: 'Space not found',
    status: 404,
    body: { message: 'Space not found' },
  } satisfies Partial<ApiError>);
});

test('sets json content type for requests with a body', async () => {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
    Response.json({ ok: true }),
  );
  vi.stubGlobal('fetch', fetchMock);

  await apiFetch('/api/spaces', {
    method: 'POST',
    body: JSON.stringify({ name: 'Narra' }),
  });

  const init = fetchMock.mock.calls[0]?.[1];
  expect(init).toBeDefined();

  if (!init) {
    throw new Error('Expected fetch to receive request options.');
  }

  expect(init.headers).toBeInstanceOf(Headers);
  expect((init.headers as Headers).get('Content-Type')).toBe('application/json');
});

test('does not set json content type for form data', async () => {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
    Response.json({ ok: true }),
  );
  vi.stubGlobal('fetch', fetchMock);

  const body = new FormData();
  body.set('name', 'Narra');

  await apiFetch('/api/spaces', {
    method: 'POST',
    body,
  });

  const init = fetchMock.mock.calls[0]?.[1];
  expect(init).toBeDefined();

  if (!init) {
    throw new Error('Expected fetch to receive request options.');
  }

  expect(init.headers).toBeInstanceOf(Headers);
  expect((init.headers as Headers).has('Content-Type')).toBe(false);
});
