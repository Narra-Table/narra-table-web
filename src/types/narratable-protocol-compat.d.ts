import type { Narratable } from '@narratable/protocol';

declare module '@narratable/protocol' {
  export type UserId = Narratable.UserId;
  export type SpaceId = Narratable.SpaceId;
  export type RoomId = Narratable.RoomId;
  export type MaskId = Narratable.MaskId;
  export type CharacterCardId = Narratable.CharacterCardId;
  export type MessageId = Narratable.MessageId;
  export type ResourceId = Narratable.ResourceId;
  export type Timestamp = Narratable.Timestamp;

  export type SpaceRole = Narratable.Space.Role;
  export type RoomType = Narratable.Room.Type;
  export type MaskType = Narratable.Mask.Type;
  export type VeilVisibility = Narratable.Veil.Visibility;
  export type MessageType = Narratable.Message.Type;
  export type ResourceKind = Narratable.Resource.Kind;

  export interface User {
    id: UserId;
    username: string;
    email?: string;
    nickname: string;
    avatar: string;
  }

  export type SpaceMember = Narratable.Space.Member;

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

  export type Room = Narratable.Room;

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

  export type Mask = Narratable.Mask;
  export type CharacterCard = Narratable.CharacterCard;
  export type Veil = Narratable.Veil;
  export type MentionTarget = Narratable.Message.MentionTarget;
  export type MessageInline = Narratable.Message.Inline;
  export type MessageBlock = Narratable.Message.Block;
  export type MessageParam = Narratable.Message.Param;
  export type MessageResult = Narratable.Message.Result;
  export type MessageEditRecord = Narratable.Message.EditRecord;
  export type ForwardedMessage = Narratable.ForwardedMessage;
  export type ForwardContent = Narratable.ForwardContent;
  export type Message = Narratable.Message;
  export type PaginatedMessages = Narratable.Message.PaginatedMessages;
  export type Resource = Narratable.Resource;

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
}
