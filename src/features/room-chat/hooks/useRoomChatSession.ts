import { useEffect, useRef, useState } from 'react';
import {
  getApiMe,
  getApiSpacesSpaceId,
  getApiSpacesSpaceIdMasks,
  postApiSpacesSpaceIdRoomsRoomIdJoin,
} from '@/api';
import type { GithubComNarraTableBackendPkgProtocolMask } from '@/api/model/githubComNarraTableBackendPkgProtocolMask';
import type { GithubComNarraTableBackendPkgProtocolMember } from '@/api/model/githubComNarraTableBackendPkgProtocolMember';
import type { GithubComNarraTableBackendPkgProtocolMemberRole } from '@/api/model/githubComNarraTableBackendPkgProtocolMemberRole';
import { getAccessToken } from '@/lib/authSession';
import { fetchRoomMessages } from '../api/history';
import {
  RoomSocket,
  roomSocketUrl,
  type RoomConnection,
  type RoomSocketEvent,
} from '../api/roomSocket';
import type { ComposerExport } from '../model/richText';
import type {
  OutgoingVeil,
  PendingMessage,
  RoomMessage,
  StagedReply,
  TextRun,
  VeilDraft,
} from '../model/types';
import { useMessageActions } from './useMessageActions';
import { useRoomChatProfile } from './useRoomChatProfile';
import { useRoomHistory } from './useRoomHistory';

const PAGE_SIZE = 50;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';
}

function eventRoomId(event: RoomSocketEvent): string | undefined {
  return event.message?.roomId ?? event.roomId;
}

export interface RoomChatSession {
  messages: RoomMessage[];
  pendings: PendingMessage[];
  pinned: RoomMessage[];
  masks: GithubComNarraTableBackendPkgProtocolMask[];
  members: GithubComNarraTableBackendPkgProtocolMember[];
  usableMasks: GithubComNarraTableBackendPkgProtocolMask[];
  maskNames: ReadonlyMap<string, string>;
  role: GithubComNarraTableBackendPkgProtocolMemberRole | null;
  userId: string | null;
  maskId: string;
  setMaskId: (maskId: string) => void;
  veil: OutgoingVeil;
  setVeil: (veil: OutgoingVeil) => void;
  canSend: boolean;
  canUseGmVeil: boolean;
  connection: RoomConnection;
  loading: boolean;
  loadingOlder: boolean;
  hasMore: boolean;
  error: string | null;
  retryLoad: () => void;
  loadOlder: () => Promise<void>;
  send: (draft: ComposerExport, reply?: StagedReply) => void;
  retryPending: (requestId: string) => void;
  pin: (message: RoomMessage) => Promise<void>;
  fold: (message: RoomMessage) => Promise<void>;
  remove: (message: RoomMessage) => Promise<void>;
  edit: (messageId: string, nodes: TextRun[]) => Promise<void>;
  updateVeil: (message: RoomMessage, draft: VeilDraft) => Promise<void>;
}

export function useRoomChatSession(spaceId: string, roomId: string): RoomChatSession {
  const { state, stateRef, dispatch, loadingOlder, loadOlder, beginRoomLoad, endRoomLoad } =
    useRoomHistory(spaceId, roomId);
  const {
    masks,
    members,
    role,
    userId,
    maskId,
    maskIdRef,
    setMaskId,
    veil,
    setVeil,
    canSend,
    canUseGmVeil,
    usableMasks,
    maskNames,
    applyProfile,
  } = useRoomChatProfile();
  const [connection, setConnection] = useState<RoomConnection>('connecting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const socketRef = useRef<RoomSocket | null>(null);

  useEffect(() => {
    const roomLoad = beginRoomLoad();
    const { controller } = roomLoad;
    const socket = new RoomSocket({
      url: roomSocketUrl(),
      token: getAccessToken,
      maxRetries: 5,
      join: async () => {
        const maskId = maskIdRef.current;
        await postApiSpacesSpaceIdRoomsRoomIdJoin(spaceId, roomId, {
          body: JSON.stringify(maskId ? { maskId } : {}),
        });
      },
      loadLatest: async () => {
        const page = await fetchRoomMessages(spaceId, roomId, { sort: 'desc', limit: PAGE_SIZE });
        return page.messages ?? [];
      },
      onStatus: setConnection,
      onDisconnect: () => dispatch({ type: 'disconnect' }),
      onGapMerge: (messages) => dispatch({ type: 'history', mode: 'merge', messages }),
      onEvent: (event) => {
        const eventRoom = eventRoomId(event);
        if (eventRoom && eventRoom !== roomId) return;
        if (event.type === 'message.created' && event.message) {
          dispatch({ type: 'created', message: event.message, requestId: event.requestId });
        } else if (event.type === 'message.updated' && event.message) {
          dispatch({ type: 'updated', message: event.message });
        } else if (event.type === 'message.deleted' && event.messageId) {
          dispatch({ type: 'deleted', messageId: event.messageId });
        } else if (event.type === 'veil.revealed') {
          dispatch({ type: 'veil', messageIds: event.messageIds ?? [] });
        } else if (event.type === 'message.rejected' && event.requestId) {
          dispatch({
            type: 'rejected',
            requestId: event.requestId,
            error: event.error?.message ?? '发送失败',
          });
        }
      },
    });
    socketRef.current = socket;

    void (async () => {
      setLoading(true);
      setError(null);
      dispatch({ type: 'reset' });
      try {
        const [me, space, maskList, latest, pins] = await Promise.all([
          getApiMe({ signal: controller.signal }),
          getApiSpacesSpaceId(spaceId, { signal: controller.signal }),
          getApiSpacesSpaceIdMasks(spaceId, { signal: controller.signal }),
          fetchRoomMessages(spaceId, roomId, { sort: 'desc', limit: PAGE_SIZE }, controller.signal),
          fetchRoomMessages(
            spaceId,
            roomId,
            { sort: 'desc', limit: PAGE_SIZE, pinnedOnly: true },
            controller.signal,
          ),
        ]);
        if (controller.signal.aborted) return;
        const id = me.data.id ?? '';
        if (maskList.status !== 200) throw new Error('面具没有加载出来');
        const allMasks = maskList.data.masks ?? [];
        applyProfile(id, space.data.members ?? [], allMasks);
        dispatch({
          type: 'history',
          mode: 'replace',
          messages: latest.messages ?? [],
          hasMore: Boolean(latest.hasMore),
        });
        dispatch({ type: 'pins', messages: pins.messages ?? [] });
        setLoading(false);
        socket.start();
      } catch (caught) {
        if (controller.signal.aborted || isAbortError(caught)) return;
        setError(caught instanceof Error ? caught.message : '历史没有加载出来');
        setLoading(false);
      }
    })();

    return () => {
      socket.stop();
      endRoomLoad(roomLoad);
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [applyProfile, attempt, beginRoomLoad, dispatch, endRoomLoad, maskIdRef, roomId, spaceId]);

  const actions = useMessageActions({
    roomId,
    stateRef,
    socketRef,
    dispatch,
    canSend,
    canUseGmVeil,
    maskId,
    veil,
  });

  return {
    messages: state.messages,
    pendings: state.pendings,
    pinned: state.pinned,
    masks,
    members,
    usableMasks,
    maskNames,
    role,
    userId,
    maskId,
    setMaskId,
    veil,
    setVeil,
    canSend,
    canUseGmVeil,
    connection,
    loading,
    loadingOlder,
    hasMore: state.hasMore,
    error,
    retryLoad: () => setAttempt((value) => value + 1),
    loadOlder,
    ...actions,
  };
}
