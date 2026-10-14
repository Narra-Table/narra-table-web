import type { GithubComNarraTableBackendPkgProtocolBlock } from '@/api/model/githubComNarraTableBackendPkgProtocolBlock';
import type { GithubComNarraTableBackendPkgProtocolMessage } from '@/api/model/githubComNarraTableBackendPkgProtocolMessage';
import type { GithubComNarraTableBackendPkgProtocolReplyPreview } from '@/api/model/githubComNarraTableBackendPkgProtocolReplyPreview';

export type RoomMessage = GithubComNarraTableBackendPkgProtocolMessage;
export type RoomBlock = GithubComNarraTableBackendPkgProtocolBlock;
export type ReplyPreview = GithubComNarraTableBackendPkgProtocolReplyPreview;

export type OutgoingVeil = 'all' | 'gm_only';

export interface StagedReply {
  messageId: string;
  preview: ReplyPreview;
}

export interface TextRun {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  ruby?: string;
}

export interface OutgoingDraft {
  text: string;
  nodes?: TextRun[];
  maskId: string;
  veilVisibility: OutgoingVeil;
  reply?: StagedReply;
}

export type PendingStatus = 'pending' | 'rejected' | 'unconfirmed';

export interface PendingMessage {
  requestId: string;
  status: PendingStatus;
  error?: string;
  draft: OutgoingDraft;
}

export type StreamEntry =
  | { kind: 'message'; message: RoomMessage }
  | { kind: 'pending'; pending: PendingMessage };

export type ReadingGroup =
  | { kind: 'speech'; messages: RoomMessage[] }
  | { kind: 'command'; message: RoomMessage; embedded?: RoomMessage; jumpToId?: string }
  | { kind: 'clue'; message: RoomMessage }
  | { kind: 'system'; message: RoomMessage }
  | { kind: 'forward'; message: RoomMessage }
  | { kind: 'folded'; message: RoomMessage }
  | { kind: 'deleted'; message: RoomMessage }
  | { kind: 'pending'; pending: PendingMessage };

export interface SceneAnchor {
  id: string;
  messageId: string;
  blockIndex: number;
  label: string;
}
