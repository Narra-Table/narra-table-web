const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  // 如果请求体是字符串且没有设置 Content-Type，则默认设置为 application/json
  if (typeof init?.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(body) ?? response.statusText, response.status, body);
  }

  return body as T;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || undefined;
}

function getErrorMessage(body: unknown): string | undefined {
  if (typeof body === 'string' && body.length > 0) {
    return body;
  }

  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = body.message;
    return typeof message === 'string' ? message : undefined;
  }

  return undefined;
}
