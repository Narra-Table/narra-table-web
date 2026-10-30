import { clearAdminSession, getAdminSession } from './adminSession';
import { HttpError } from './httpError';
import { notifySessionExpired } from './sessionExpiry';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class AdminApiError extends HttpError {
  readonly code: string;

  constructor(message: string, status: number, code = '', body?: unknown) {
    super(message, status, body, 'admin');
    this.name = 'AdminApiError';
    this.code = code;
  }
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (typeof init?.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getAdminSession()?.token;
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : (await response.text()) || undefined;

  if (!response.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : response.statusText;
    const code =
      typeof body === 'object' && body !== null && 'code' in body && typeof body.code === 'string'
        ? body.code
        : '';
    if (response.status === 401 && token && path !== '/admin/login') {
      clearAdminSession();
      notifySessionExpired('admin');
    }
    throw new AdminApiError(message, response.status, code, body);
  }

  return body as T;
}
