import type { GithubComNarraTableBackendPkgProtocolMaskTypeProperty } from '@/api/model/githubComNarraTableBackendPkgProtocolMaskTypeProperty';
import type { GithubComNarraTableBackendPkgProtocolMemberRole } from '@/api/model/githubComNarraTableBackendPkgProtocolMemberRole';

export const ROLE_LABEL: Record<GithubComNarraTableBackendPkgProtocolMemberRole, string> = {
  gm: '主持',
  agm: '副主持',
  pl: '玩家',
  ob: '观察',
};

export const MASK_SECTIONS: {
  type: GithubComNarraTableBackendPkgProtocolMaskTypeProperty;
  label: string;
}[] = [
  { type: 'gm', label: '主持' },
  { type: 'character', label: '角色' },
  { type: 'npc', label: 'NPC' },
  { type: 'system', label: '系统' },
];
