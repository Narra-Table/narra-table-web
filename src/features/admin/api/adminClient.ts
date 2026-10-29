import {
  deleteAdminPluginsPluginId,
  deleteAdminUsersUserId,
  getAdminPlugins,
  getAdminUsers,
  postAdminChangePassword,
  postAdminLogin,
  postAdminPlugins,
  postAdminPluginsPluginIdPackage,
  postAdminPluginsValidate,
} from '@/api';
import type { GetAdminUsersParams, InternalHandlerAdminUserResponse } from '@/api/model';

export { AdminApiError } from '@/lib/adminApiClient';
export {
  getAdminDashboard,
  getAdminUsersUserId as getAdminUser,
  patchAdminPluginsPluginId as updateAdminPlugin,
  postAdminUsersUserIdDisable as disableAdminUser,
  postAdminUsersUserIdRestore as restoreAdminUser,
  postAdminUsersUserIdTemporaryPassword as issueTemporaryPassword,
} from '@/api';
export type {
  InternalHandlerAdminLoginResponse as AdminLoginResult,
  InternalHandlerAdminDashboardResponse as AdminDashboard,
  InternalHandlerAdminUserResponse as AdminUser,
  InternalHandlerAdminUserListResponse as AdminUserList,
  GithubComNarraTableBackendPkgProtocolPluginWindow as PluginWindow,
  GithubComNarraTableBackendPkgProtocolPluginPackageInfo as AdminPluginPackageInfo,
  GithubComNarraTableBackendPkgProtocolPlugin as AdminPlugin,
  InternalHandlerAdminPluginValidationResponse as AdminPluginValidation,
} from '@/api/model';

export type AdminUserStatus = InternalHandlerAdminUserResponse['status'];
export type AdminUserQuery = Omit<GetAdminUsersParams, 'page' | 'status'> & {
  page: number;
  status?: AdminUserStatus | '';
};

export function adminLogin(username: string, password: string) {
  return postAdminLogin({ username, password });
}

export function adminChangePassword(oldPassword: string, newPassword: string) {
  return postAdminChangePassword({ oldPassword, newPassword });
}

export function listAdminUsers(query: AdminUserQuery) {
  return getAdminUsers({ ...query, status: query.status || undefined });
}

export function anonymizeAdminUser(userId: string) {
  return deleteAdminUsersUserId(userId, { confirm: true });
}

export function listAdminPlugins() {
  return getAdminPlugins();
}

export function validateAdminPlugin(file: File) {
  return postAdminPluginsValidate({ file });
}

export function createAdminPlugin(file: File, enabled = true) {
  return postAdminPlugins({ file, enabled });
}

export function replaceAdminPlugin(pluginId: string, file: File) {
  return postAdminPluginsPluginIdPackage(pluginId, { file });
}

export function deleteAdminPlugin(pluginId: string) {
  return deleteAdminPluginsPluginId(pluginId);
}
