import { clearAuth, getAccessToken, refreshAccessToken } from './auth';

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

export const orvalFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const request = async (token: string | null) => {
    const headers = new Headers(options?.headers);

    if (typeof options?.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${API_BASE_URL}${url}`, { ...options, headers });
  };

  let response = await request(getAccessToken());
  if (response.status === 401 && !url.startsWith('/auth/')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) response = await request(refreshed);
    else clearAuth();
  }

  if (response.status === 204 || response.status === 205) {
    return { data: undefined, status: response.status, headers: response.headers } as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : (await response.text()) || undefined;

  if (!response.ok) {
    const message =
      typeof body === 'string'
        ? body
        : typeof body === 'object' &&
            body !== null &&
            'message' in body &&
            typeof body.message === 'string'
          ? body.message
          : response.statusText;
    throw new ApiError(message, response.status, body);
  }

  return { data: body, status: response.status, headers: response.headers } as T;
};
