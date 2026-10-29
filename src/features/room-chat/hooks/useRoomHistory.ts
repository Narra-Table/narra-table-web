import { useCallback, useRef, useState } from 'react';
import { fetchRoomMessages } from '../api/history';
import {
  initialRoomChatState,
  reduceRoomChat,
  type RoomChatAction,
  type RoomChatState,
} from '../model/reduceRoomChat';

const PAGE_SIZE = 50;

interface RoomLoad {
  generation: number;
  controller: AbortController;
}

export function useRoomHistory(spaceId: string, roomId: string) {
  const [state, setState] = useState<RoomChatState>(initialRoomChatState);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const loadingOlderRef = useRef(false);
  const roomGenerationRef = useRef(0);
  const roomControllerRef = useRef<AbortController | null>(null);

  const dispatch = useCallback((action: RoomChatAction) => {
    setState((current) => reduceRoomChat(current, action));
  }, []);

  const beginRoomLoad = useCallback((): RoomLoad => {
    const generation = roomGenerationRef.current + 1;
    roomGenerationRef.current = generation;
    const controller = new AbortController();
    roomControllerRef.current = controller;
    return { generation, controller };
  }, []);

  const endRoomLoad = useCallback(({ generation, controller }: RoomLoad) => {
    controller.abort();
    if (roomControllerRef.current === controller) roomControllerRef.current = null;
    if (roomGenerationRef.current === generation) {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, []);

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

  return {
    state,
    stateRef,
    dispatch,
    loadingOlder,
    loadOlder,
    beginRoomLoad,
    endRoomLoad,
  };
}
