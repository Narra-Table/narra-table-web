import type { GithubComNarraTableBackendPkgProtocolMemberRole } from '@/api/model/githubComNarraTableBackendPkgProtocolMemberRole';

export interface MoreActionSet {
  panel: boolean;
  copy: boolean;
  history: boolean;
  edit: boolean;
  pin: boolean;
  fold: boolean;
  veil: boolean;
  remove: boolean;
}

export function moreActions(input: {
  role: GithubComNarraTableBackendPkgProtocolMemberRole | null;
  userId: string | null;
  senderId: string | undefined;
  messageType: string | undefined;
}): MoreActionSet {
  const staff = input.role === 'gm' || input.role === 'agm';
  const own = input.userId !== null && input.senderId === input.userId;
  const privileged = staff || own;
  const panel = input.role === 'pl' || staff;
  return {
    panel,
    copy: panel,
    history: panel && privileged,
    edit: panel && privileged && input.messageType === 'chat',
    pin: panel && privileged,
    fold: panel && privileged,
    veil: staff,
    remove: panel && privileged,
  };
}
