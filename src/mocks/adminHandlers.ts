import { http, HttpResponse } from 'msw';
import type {
  AdminPlugin,
  AdminPluginPackageInfo,
  AdminUser,
  AdminUserStatus,
} from '@/features/admin';

type StoredUser = AdminUser;

const mockPackage: AdminPluginPackageInfo = {
  name: 'example',
  displayName: '示例插件',
  version: '0.1.0',
  description: '一条示例指令。',
  author: 'NarraTable',
  depends: [{ id: 'dice', constraint: '^1.0.0' }],
  windows: [
    {
      id: 'panel',
      title: '示例',
      entry: 'windows/panel.html',
      dismissible: true,
      embeddable: true,
      launcher: true,
      resizable: true,
    },
  ],
};

let password = 'admin';
let forceChangePassword = true;
let tokenVersion = 1;
let users: StoredUser[] = [
  user('user-active', 'lin', '林夏', 'active', false),
  user('user-disabled', 'zhou', '周衡', 'disabled', false),
  user('user-reset', 'guest', '临时访客', 'active', true),
];
let plugins: AdminPlugin[] = [
  {
    pluginId: 'plugin-dice',
    name: 'dice',
    displayName: '骰子',
    version: '1.0.0',
    description: '内置掷骰指令',
    author: '故桌',
    source: 'export default function () {}',
    builtIn: true,
    enabled: true,
    createdAt: '2026-05-01T08:00:00.000Z',
    updatedAt: '2026-05-01T08:00:00.000Z',
  },
  {
    pluginId: 'plugin-note',
    name: 'table-note',
    displayName: '桌面笔记',
    version: '0.2.0',
    description: '自定义记录指令',
    author: '操作员',
    source: 'export function note() { return "noted"; }',
    depends: [{ id: 'dice', constraint: '^1.0.0' }],
    windows: [
      {
        id: 'notes',
        title: '笔记',
        entry: 'windows/notes.html',
        dismissible: true,
        embeddable: true,
        launcher: true,
        resizable: true,
      },
    ],
    builtIn: false,
    enabled: true,
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
  },
];

function user(
  id: string,
  username: string,
  nickname: string,
  status: AdminUserStatus,
  mustChangePassword: boolean,
): StoredUser {
  return {
    id,
    username,
    email: status === 'deleted' ? undefined : `${username}@example.com`,
    nickname,
    avatar: '',
    status,
    mustChangePassword,
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-07-01T08:00:00.000Z',
  };
}

function token() {
  return `mock-admin-token-${tokenVersion}`;
}

function unauthorized() {
  return HttpResponse.json(
    { code: 'unauthorized', message: 'invalid username or password' },
    { status: 401 },
  );
}

function requireAdmin(request: Request) {
  return request.headers.get('Authorization') === `Bearer ${token()}`;
}

function rejectAdmin() {
  return HttpResponse.json({ code: 'unauthorized', message: 'unauthorized' }, { status: 401 });
}

function findUser(userId: string) {
  return users.find((item) => item.id === userId);
}

export const adminHandlers = [
  http.post('*/admin/login', async ({ request }) => {
    const body = (await request.json()) as { username?: string; password?: string };
    if (body.username !== 'admin' || body.password !== password) return unauthorized();
    return HttpResponse.json({
      accessToken: token(),
      expiresIn: 3600,
      forceChangePassword,
    });
  }),

  http.post('*/admin/change-password', async ({ request }) => {
    if (!requireAdmin(request)) return rejectAdmin();
    const body = (await request.json()) as { oldPassword?: string; newPassword?: string };
    if (!body.oldPassword || !body.newPassword) {
      return HttpResponse.json(
        { code: 'invalid_request', message: 'old password and new password are required' },
        { status: 400 },
      );
    }
    if (body.oldPassword !== password) {
      return HttpResponse.json(
        { code: 'invalid_request', message: 'incorrect old password' },
        { status: 400 },
      );
    }
    if (body.newPassword.length < 8 || body.newPassword.length > 72) {
      return HttpResponse.json(
        { code: 'invalid_password', message: 'invalid_password' },
        { status: 400 },
      );
    }
    password = body.newPassword;
    forceChangePassword = false;
    tokenVersion += 1;
    return HttpResponse.json({ message: 'password changed' });
  }),

  http.get('*/admin/dashboard', ({ request }) => {
    if (!requireAdmin(request)) return rejectAdmin();
    return HttpResponse.json({ userCount: users.length, adminCount: 1 });
  }),

  http.get('*/admin/users', ({ request }) => {
    if (!requireAdmin(request)) return rejectAdmin();
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1);
    const pageSize = Math.max(1, Number(url.searchParams.get('pageSize') ?? 20) || 20);
    const status = url.searchParams.get('status') ?? '';
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
    const filtered = users.filter((item) => {
      if (status && item.status !== status) return false;
      if (!search) return true;
      return [item.username, item.nickname, item.email ?? ''].some((value) =>
        value.toLowerCase().includes(search),
      );
    });
    const start = (page - 1) * pageSize;
    return HttpResponse.json({
      users: filtered.slice(start, start + pageSize),
      page,
      pageSize,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    });
  }),

  http.get('*/admin/users/:userId', ({ request, params }) => {
    if (!requireAdmin(request)) return rejectAdmin();
    const found = findUser(String(params.userId));
    if (!found) {
      return HttpResponse.json({ code: 'not_found', message: 'user not found' }, { status: 404 });
    }
    return HttpResponse.json(found);
  }),

  http.post('*/admin/users/:userId/disable', ({ request, params }) => {
    if (!requireAdmin(request)) return rejectAdmin();
    const found = findUser(String(params.userId));
    if (!found) {
      return HttpResponse.json({ code: 'not_found', message: 'user not found' }, { status: 404 });
    }
    if (found.status !== 'active') {
      return HttpResponse.json(
        { code: 'conflict', message: 'user cannot be disabled' },
        { status: 409 },
      );
    }
    found.status = 'disabled';
    found.updatedAt = new Date().toISOString();
    return HttpResponse.json(found);
  }),

  http.post('*/admin/users/:userId/restore', ({ request, params }) => {
    if (!requireAdmin(request)) return rejectAdmin();
    const found = findUser(String(params.userId));
    if (!found) {
      return HttpResponse.json({ code: 'not_found', message: 'user not found' }, { status: 404 });
    }
    if (found.status !== 'disabled') {
      return HttpResponse.json(
        { code: 'conflict', message: 'user cannot be restored' },
        { status: 409 },
      );
    }
    found.status = 'active';
    found.updatedAt = new Date().toISOString();
    return HttpResponse.json(found);
  }),

  http.post('*/admin/users/:userId/temporary-password', ({ request, params }) => {
    if (!requireAdmin(request)) return rejectAdmin();
    const found = findUser(String(params.userId));
    if (!found || found.status === 'deleted') {
      return HttpResponse.json(
        { code: 'conflict', message: found ? 'user cannot be reset' : 'user not found' },
        { status: found ? 409 : 404 },
      );
    }
    found.status = 'active';
    found.mustChangePassword = true;
    found.updatedAt = new Date().toISOString();
    return HttpResponse.json({
      temporaryPassword: `Temp-${found.username}-1842`,
      user: found,
    });
  }),

  http.delete('*/admin/users/:userId', async ({ request, params }) => {
    if (!requireAdmin(request)) return rejectAdmin();
    const found = findUser(String(params.userId));
    if (!found) {
      return HttpResponse.json({ code: 'not_found', message: 'user not found' }, { status: 404 });
    }
    if (found.status === 'deleted') {
      return HttpResponse.json(
        { code: 'conflict', message: 'user is already anonymized' },
        { status: 409 },
      );
    }
    const body = (await request.json()) as { confirm?: boolean };
    if (!body.confirm) {
      return HttpResponse.json(
        { code: 'invalid_request', message: 'confirm must be true' },
        { status: 400 },
      );
    }
    found.status = 'deleted';
    found.nickname = '已匿名';
    found.email = undefined;
    found.mustChangePassword = false;
    found.updatedAt = new Date().toISOString();
    return HttpResponse.json(found);
  }),

  http.post('*/admin/plugins/validate', async ({ request }) => {
    if (!requireAdmin(request)) return rejectAdmin();
    const file = await ntpFile(request);
    if (file instanceof HttpResponse) return file;
    return HttpResponse.json({
      valid: true,
      plugin: mockPackage,
      commands: [{ name: 'note', description: '记录一条桌面笔记' }],
    });
  }),

  http.get('*/admin/plugins', ({ request }) => {
    if (!requireAdmin(request)) return rejectAdmin();
    return HttpResponse.json({ plugins });
  }),

  http.post('*/admin/plugins', async ({ request }) => {
    if (!requireAdmin(request)) return rejectAdmin();
    const file = await ntpFile(request);
    if (file instanceof HttpResponse) return file;
    if (plugins.some((plugin) => plugin.name === mockPackage.name)) {
      return HttpResponse.json(
        { code: 'conflict', message: 'plugin name already exists' },
        { status: 409 },
      );
    }
    const created: AdminPlugin = {
      pluginId: `plugin-${mockPackage.name}`,
      ...mockPackage,
      source: '',
      builtIn: false,
      enabled: file.enabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    plugins = [created, ...plugins];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.post('*/admin/plugins/:pluginId/package', async ({ request, params }) => {
    if (!requireAdmin(request)) return rejectAdmin();
    const plugin = plugins.find((item) => item.pluginId === params.pluginId);
    if (!plugin) {
      return HttpResponse.json({ code: 'not_found', message: 'plugin not found' }, { status: 404 });
    }
    if (plugin.builtIn) {
      return HttpResponse.json(
        { code: 'invalid_request', message: 'built-in plugins are read-only' },
        { status: 400 },
      );
    }
    const file = await ntpFile(request);
    if (file instanceof HttpResponse) return file;
    if (file.name.toLowerCase().includes('other') || plugin.name !== mockPackage.name) {
      return HttpResponse.json(
        { code: 'invalid_request', message: 'plugin package name does not match' },
        { status: 400 },
      );
    }
    Object.assign(plugin, {
      ...mockPackage,
      version: '0.2.0',
      displayName: '示例插件',
      updatedAt: new Date().toISOString(),
    });
    return HttpResponse.json(plugin);
  }),

  http.patch('*/admin/plugins/:pluginId', async ({ request, params }) => {
    if (!requireAdmin(request)) return rejectAdmin();
    const plugin = plugins.find((item) => item.pluginId === params.pluginId);
    if (!plugin) {
      return HttpResponse.json({ code: 'not_found', message: 'plugin not found' }, { status: 404 });
    }
    if (plugin.builtIn) {
      return HttpResponse.json(
        { code: 'invalid_request', message: 'built-in plugins are read-only' },
        { status: 400 },
      );
    }
    const body = (await request.json()) as { enabled?: boolean };
    if (body.enabled !== undefined) plugin.enabled = body.enabled;
    plugin.updatedAt = new Date().toISOString();
    return HttpResponse.json(plugin);
  }),

  http.delete('*/admin/plugins/:pluginId', ({ request, params }) => {
    if (!requireAdmin(request)) return rejectAdmin();
    const plugin = plugins.find((item) => item.pluginId === params.pluginId);
    if (!plugin) {
      return HttpResponse.json({ code: 'not_found', message: 'plugin not found' }, { status: 404 });
    }
    if (plugin.builtIn) {
      return HttpResponse.json(
        { code: 'invalid_request', message: 'built-in plugins are read-only' },
        { status: 400 },
      );
    }
    plugins = plugins.filter((item) => item.pluginId !== plugin.pluginId);
    return new HttpResponse(null, { status: 204 });
  }),
];

async function ntpFile(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return HttpResponse.json(
      { code: 'invalid_request', message: 'file is required' },
      { status: 400 },
    );
  }
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return HttpResponse.json(
      { code: 'invalid_request', message: 'file is required' },
      { status: 400 },
    );
  }
  if (!file.name.toLowerCase().endsWith('.ntp')) {
    return HttpResponse.json(
      { code: 'invalid_request', message: 'file must be a .ntp package' },
      { status: 400 },
    );
  }
  if (file.name.toLowerCase().includes('broken')) {
    return HttpResponse.json(
      { code: 'invalid_request', message: 'plugin source failed to load' },
      { status: 400 },
    );
  }
  return { name: file.name, enabled: form.get('enabled') !== 'false' };
}
