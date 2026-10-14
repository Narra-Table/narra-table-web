import { getAdminSession } from './adminAuth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class AdminApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = '') {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
  }
}

export type AdminLoginResult = {
  accessToken: string;
  expiresIn: number;
  forceChangePassword: boolean;
};

export type AdminDashboard = {
  userCount: number;
  adminCount: number;
};

export type AdminUserStatus = 'active' | 'disabled' | 'deleted';

export type AdminUser = {
  id: string;
  username: string;
  email?: string;
  nickname: string;
  avatar: string;
  status: AdminUserStatus;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserList = {
  users: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminUserQuery = {
  page: number;
  pageSize?: number;
  status?: AdminUserStatus | '';
  search?: string;
};

export type PluginWindow = {
  id: string;
  title: string;
  visibility?: string;
  entry: string;
};

export type AdminPluginPackageInfo = {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  characterDataType?: string;
  depends?: string[];
  windows?: PluginWindow[];
};

export type AdminPlugin = AdminPluginPackageInfo & {
  pluginId: string;
  source: string;
  builtIn: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminPluginValidation = {
  valid: boolean;
  plugin: AdminPluginPackageInfo;
  commands: { name: string; description?: string }[];
};

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
    throw new AdminApiError(message, response.status, code);
  }

  return body as T;
}

export function adminLogin(username: string, password: string) {
  return adminFetch<AdminLoginResult>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function adminChangePassword(oldPassword: string, newPassword: string) {
  return adminFetch<{ message: string }>('/admin/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

export function getAdminDashboard() {
  return adminFetch<AdminDashboard>('/admin/dashboard');
}

export function listAdminUsers(query: AdminUserQuery) {
  const params = new URLSearchParams({ page: String(query.page) });
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  if (query.status) params.set('status', query.status);
  if (query.search) params.set('search', query.search);
  return adminFetch<AdminUserList>(`/admin/users?${params.toString()}`);
}

export function getAdminUser(userId: string) {
  return adminFetch<AdminUser>(`/admin/users/${encodeURIComponent(userId)}`);
}

export function disableAdminUser(userId: string) {
  return adminFetch<AdminUser>(`/admin/users/${encodeURIComponent(userId)}/disable`, {
    method: 'POST',
  });
}

export function restoreAdminUser(userId: string) {
  return adminFetch<AdminUser>(`/admin/users/${encodeURIComponent(userId)}/restore`, {
    method: 'POST',
  });
}

export function issueTemporaryPassword(userId: string) {
  return adminFetch<{ temporaryPassword: string; user: AdminUser }>(
    `/admin/users/${encodeURIComponent(userId)}/temporary-password`,
    { method: 'POST' },
  );
}

export function anonymizeAdminUser(userId: string) {
  return adminFetch<AdminUser>(`/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    body: JSON.stringify({ confirm: true }),
  });
}

export function listAdminPlugins() {
  return adminFetch<{ plugins: AdminPlugin[] }>('/admin/plugins');
}

export function validateAdminPlugin(file: File) {
  const body = new FormData();
  body.set('file', file);
  return adminFetch<AdminPluginValidation>('/admin/plugins/validate', {
    method: 'POST',
    body,
  });
}

export function createAdminPlugin(file: File, enabled = true) {
  const body = new FormData();
  body.set('file', file);
  body.set('enabled', String(enabled));
  return adminFetch<AdminPlugin>('/admin/plugins', {
    method: 'POST',
    body,
  });
}

export function replaceAdminPlugin(pluginId: string, file: File) {
  const body = new FormData();
  body.set('file', file);
  return adminFetch<AdminPlugin>(`/admin/plugins/${encodeURIComponent(pluginId)}/package`, {
    method: 'POST',
    body,
  });
}

export function updateAdminPlugin(pluginId: string, patch: { enabled?: boolean }) {
  return adminFetch<AdminPlugin>(`/admin/plugins/${encodeURIComponent(pluginId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function deleteAdminPlugin(pluginId: string) {
  return adminFetch<void>(`/admin/plugins/${encodeURIComponent(pluginId)}`, {
    method: 'DELETE',
  });
}
