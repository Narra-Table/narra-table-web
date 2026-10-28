import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getApiMe,
  getApiSpacesSpaceId,
  getApiSpacesSpaceIdMasks,
  postApiSpacesSpaceIdRoomsRoomIdJoin,
} from '@/api';
import type { GithubComNarraTableBackendPkgProtocolMask } from '@/api/model/githubComNarraTableBackendPkgProtocolMask';
import type { GithubComNarraTableBackendPkgProtocolMember } from '@/api/model/githubComNarraTableBackendPkgProtocolMember';
import type { GithubComNarraTableBackendPkgProtocolMemberRole } from '@/api/model/githubComNarraTableBackendPkgProtocolMemberRole';
import { getAccessToken } from '@/lib/auth';
import { fetchRoomMessages } from '../api/history';
import {
  RoomSocket,
  roomSocketUrl,
  type RoomConnection,
  type RoomSocketEvent,
} from '../api/roomSocket';
import { initialRoomChatState, reduceRoomChat, type RoomChatState } from '../model/reduceRoomChat';
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
  const [state, setState] = useState<RoomChatState>(initialRoomChatState);
  const [masks, setMasks] = useState<GithubComNarraTableBackendPkgProtocolMask[]>([]);
  const [members, setMembers] = useState<GithubComNarraTableBackendPkgProtocolMember[]>([]);
  const [role, setRole] = useState<GithubComNarraTableBackendPkgProtocolMemberRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [maskId, setMaskId] = useState('');
  const [veil, setVeilState] = useState<OutgoingVeil>('all');
  const [connection, setConnection] = useState<RoomConnection>('connecting');
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const stateRef = useRef(state);
  stateRef.current = state;
  const loadingOlderRef = useRef(false);
  const roomGenerationRef = useRef(0);
  const roomControllerRef = useRef<AbortController | null>(null);
  const socketRef = useRef<RoomSocket | null>(null);
  const maskIdRef = useRef(maskId);
  maskIdRef.current = maskId;

  const dispatch = useCallback((action: Parameters<typeof reduceRoomChat>[1]) => {
    setState((current) => reduceRoomChat(current, action));
  }, []);

  const canUseGmVeil = role === 'gm' || role === 'agm';
  const canSend = role === 'gm' || role === 'agm' || role === 'pl';

  const setVeil = useCallback(
    (next: OutgoingVeil) => {
      if (next === 'gm_only' && !(role === 'gm' || role === 'agm')) return;
      setVeilState(next);
    },
    [role],
  );

  useEffect(() => {
    if (role === 'gm' || role === 'agm') return;
    setVeilState('all');
  }, [role]);

  const usableMasks = useMemo(
    () => masks.filter((mask) => userId !== null && (mask.userIds ?? []).includes(userId)),
    [masks, userId],
  );

  useEffect(() => {
    if (usableMasks.some((mask) => mask.maskId === maskId)) return;
    setMaskId(usableMasks[0]?.maskId ?? '');
  }, [usableMasks, maskId]);

  const maskNames = useMemo(() => new Map(masks.map((mask) => [mask.maskId, mask.name])), [masks]);

  const loadOlder = useCallback(async () => {
    const current = stateRef.current;
    const cursor = current.messages[0]?.messageId;
    if (loadingOlderRef.current || !current.hasMore || !cursor) return;
    const generation = roomGenerationRef.current;
    const signal = roomControllerRef.current?.signal;
    if (signal?.aborted) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const page = await fetchRoomMessages(
        spaceId,
        roomId,
        {
          cursor,
          sort: 'desc',
          limit: PAGE_SIZE,
        },
        signal,
      );
      if (roomGenerationRef.current !== generation || signal?.aborted) return;
      dispatch({
        type: 'history',
        mode: 'prepend',
        messages: page.messages ?? [],
        hasMore: Boolean(page.hasMore),
      });
    } finally {
      if (roomGenerationRef.current === generation) {
        loadingOlderRef.current = false;
        setLoadingOlder(false);
      }
    }
  }, [dispatch, roomId, spaceId]);

  useEffect(() => {
    const generation = roomGenerationRef.current + 1;
    roomGenerationRef.current = generation;
    const controller = new AbortController();
    roomControllerRef.current = controller;
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
        setUserId(id);
        const member = (space.data.members ?? []).find((item) => item.userId === id);
        setRole(member?.role ?? null);
        setMembers(space.data.members ?? []);
        if (maskList.status !== 200) throw new Error('面具没有加载出来');
        const allMasks = maskList.data.masks ?? [];
        setMasks(allMasks);
        const usable = allMasks.filter((mask) => (mask.userIds ?? []).includes(id));
        const preferred =
          usable.find((mask) => mask.maskId === member?.maskId) ??
          usable.find((mask) => mask.isDefault) ??
          usable[0];
        if (preferred && !maskIdRef.current) maskIdRef.current = preferred.maskId;
        setMaskId((current) => current || preferred?.maskId || '');
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
      controller.abort();
      socket.stop();
      if (roomControllerRef.current === controller) roomControllerRef.current = null;
      if (roomGenerationRef.current === generation) {
        loadingOlderRef.current = false;
        setLoadingOlder(false);
      }
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [attempt, dispatch, roomId, spaceId]);

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
