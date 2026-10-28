import type { GithubComNarraTableBackendPkgProtocolMask } from '@/api/model/githubComNarraTableBackendPkgProtocolMask';
import type { GithubComNarraTableBackendPkgProtocolMember } from '@/api/model/githubComNarraTableBackendPkgProtocolMember';
import type { GithubComNarraTableBackendPkgProtocolMemberRole } from '@/api/model/githubComNarraTableBackendPkgProtocolMemberRole';
import type { ReadingGroup, RoomMessage, VeilDraft } from '../../model/types';

export interface ReadingGroupsProps {
  groups: ReadingGroup[];
  masks: GithubComNarraTableBackendPkgProtocolMask[];
  maskNames: ReadonlyMap<string, string>;
  spaceId: string;
  userId: string | null;
  role: GithubComNarraTableBackendPkgProtocolMemberRole | null;
  members: GithubComNarraTableBackendPkgProtocolMember[];
  canSend: boolean;
  canUseGmVeil: boolean;
  highlightId?: string | null;
  freshId?: string | null;
  onReply: (message: RoomMessage) => void;
  onPin: (message: RoomMessage) => void;
  onFold: (message: RoomMessage) => void;
  onDelete: (message: RoomMessage) => void;
  onEdit: (message: RoomMessage) => void;
  onVeil: (message: RoomMessage, draft: VeilDraft) => void;
  onJump: (messageId: string) => void;
  onRetry: (requestId: string) => void;
}
