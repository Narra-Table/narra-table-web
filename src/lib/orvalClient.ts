import { getAccessToken } from './auth';

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
  const headers = new Headers(options?.headers);

  if (typeof options?.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });

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
