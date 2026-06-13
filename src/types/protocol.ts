// Types derived from the Narratable protocol v1
// https://github.com/Narra-Table/protocol/blob/main/proposed_protocol.d.ts

export type UserId = string;
export type SpaceId = string;
export type RoomId = string;
export type MaskId = string;
export type CharacterCardId = string;
export type MessageId = string;
export type ResourceId = string;
export type Timestamp = string; // ISO 8601

export type SpaceRole = 'gm' | 'agm' | 'pl' | 'ob';
export type RoomType = 'session' | 'reference' | 'private' | 'tool';
export type MaskType = 'character' | 'npc' | 'system' | 'gm';
export type VeilVisibility = 'all' | 'gm_only' | 'custom' | 'gm_and_custom';
export type MessageType = 'chat' | 'clue' | 'command' | 'system' | 'forward';
export type ResourceKind = 'image' | 'audio' | 'video' | 'document' | 'archive' | 'other';

// ── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id: UserId;
  username: string;
  email?: string;
  nickname: string;
  avatar: string;
}

// ── Space ─────────────────────────────────────────────────────────────────────

export interface SpaceMember {
  userId: UserId;
  role: SpaceRole;
  displayName: string;
  joinedAt: Timestamp;
}

/** Returned by GET /api/spaces (list view) */
export interface SpaceSummary {
  spaceId: SpaceId;
  name: string;
  description?: string;
  avatar?: string;
  ownerId: UserId;
  memberCount: number;
  status: 'active' | 'archived';
  myRole: SpaceRole;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}

/** Returned by GET /api/spaces/:spaceId (detail view) */
export interface SpaceDetail {
  spaceId: SpaceId;
  name: string;
  description: string;
  avatar?: string;
  ownerId: UserId;
  members: SpaceMember[];
  rooms: RoomId[];
  masks: MaskId[];
  status: 'active' | 'archived';
  moduleSource?: { moduleId: string; moduleName: string };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt?: Timestamp;
}

// ── Room ──────────────────────────────────────────────────────────────────────

export interface Room {
  roomId: RoomId;
  spaceId: SpaceId;
  name: string;
  description: string;
  type: RoomType;
  sortOrder: number;
  visibleMemberIds?: UserId[];
  isArchived: boolean;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}

/** Returned by GET /api/spaces/:spaceId/rooms (list view) */
export interface RoomSummary {
  roomId: RoomId;
  spaceId: SpaceId;
  name: string;
  description: string;
  type: RoomType;
  sortOrder: number;
  hasJoinCode: boolean;
  isArchived: boolean;
  lastMessage?: {
    senderName: string;
    textSnippet: string;
    sendTime: Timestamp;
  };
  unreadCount: number;
  memberCount: number;
  lastActiveAt: Timestamp;
}

// ── Mask ──────────────────────────────────────────────────────────────────────

export interface Mask {
  maskId: MaskId;
  spaceId: SpaceId;
  name: string;
  /** avatar name → resourceId mapping, e.g. { "default": "av_001", "立绘": "av_002" } */
  avatars: Record<string, string>;
  currentAvatarId: string;
  defaultAvatarId: string;
  type: MaskType;
  characterCards: CharacterCardId[];
  userIds: UserId[];
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ── Character Card ────────────────────────────────────────────────────────────

export interface CharacterCard {
  id: CharacterCardId;
  maskId: MaskId;
  /** Rule system name, e.g. "COC 7th", "DND 5e" */
  name: string;
  attributes: Record<string, unknown>;
  templateId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ── Veil ──────────────────────────────────────────────────────────────────────

export interface Veil {
  visibility: VeilVisibility;
  visibleTo?: UserId[];
  revealOnSpaceClose: boolean;
}

// ── Message ───────────────────────────────────────────────────────────────────

export type MentionTarget =
  | { kind: 'user'; userId: UserId }
  | { kind: 'mask'; maskId: MaskId }
  | { kind: 'characterCard'; characterCardId: CharacterCardId };

export type MessageInline =
  | {
      type: 'text';
      text: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikethrough?: boolean;
    }
  | { type: 'mention'; target: MentionTarget; displayText?: string }
  | { type: 'face'; faceId: string };

export type MessageBlock =
  | { type: 'paragraph'; children: MessageInline[] }
  | { type: 'image'; resourceId: string; width: number; height: number; alt?: string }
  | { type: 'audio'; resourceId: string; title?: string; duration?: number }
  | { type: 'table'; headers: string[]; rows: string[][]; caption?: string }
  | { type: 'reply'; messageId: MessageId; preview?: { senderName: string; textSnippet: string } }
  | { type: 'divider'; label?: string };

export interface MessageParam {
  name: string;
  value: string;
}

export interface MessageResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface MessageEditRecord {
  editTime: Timestamp;
  previousRaw: unknown;
  editBy: UserId;
}

export interface ForwardedMessage {
  sourceMessageId?: MessageId;
  sourceRoomId?: string;
  senderMaskId: MaskId;
  senderName: string;
  avatarId: string;
  type: string;
  blocks: MessageBlock[];
  timestamp: Timestamp;
  forward?: ForwardContent;
}

export interface ForwardContent {
  title: string;
  sourceDesc?: string;
  messages: ForwardedMessage[];
  depth: number;
}

export interface Message {
  messageId: MessageId;
  roomId: RoomId;
  spaceId: SpaceId;
  type: MessageType;
  sender: { userId: UserId; maskId: MaskId };
  sendTime: Timestamp;
  updateTime?: Timestamp;
  deleted: boolean;
  pinned: boolean;
  folded: boolean;
  veil: Veil;
  content?: MessageBlock[];
  clue?: {
    title: string;
    description: string;
    imageUrl?: string;
    tags: string[];
    isDiscovered: boolean;
  };
  command?: string;
  params?: MessageParam[];
  raw?: string;
  result?: MessageResult;
  refMessageId?: MessageId;
  forward?: ForwardContent;
  editHistory: MessageEditRecord[];
}

export interface PaginatedMessages {
  messages: Message[];
  nextCursor: MessageId | null;
  hasMore: boolean;
}

// ── Resource ──────────────────────────────────────────────────────────────────

export interface Resource {
  resourceId: ResourceId;
  spaceId: SpaceId;
  roomId?: RoomId;
  messageId?: MessageId;
  name: string;
  kind: ResourceKind;
  uri: string;
  mimeType: string;
  sizeBytes: number;
  checksum?: string;
  metadata?: Record<string, unknown>;
  uploadedBy: UserId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ── API response wrappers ─────────────────────────────────────────────────────

export interface SpacesListResponse {
  spaces: SpaceSummary[];
}

export interface RoomsListResponse {
  rooms: RoomSummary[];
}

export interface MaskListResponse {
  masks: Mask[];
}

export interface CharacterCardListResponse {
  cards: CharacterCard[];
}

export interface ResourceListResponse {
  resources: Resource[];
}
