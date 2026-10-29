import { useLayoutEffect, useRef, useState } from 'react';
import { compensatePrepend, isStuckToBottom, shouldStickToBottom } from '../model/scrollAnchor';
import type { PendingMessage, RoomMessage } from '../model/types';

interface ReadingScrollInput {
  messages: RoomMessage[];
  pendings: PendingMessage[];
  hasMore: boolean;
  loadingOlder: boolean;
  loadOlder: () => Promise<void>;
}

export type ReadingScrollController = ReturnType<typeof useReadingScroll>;

export function useReadingScroll({
  messages,
  pendings,
  hasMore,
  loadingOlder,
  loadOlder,
}: ReadingScrollInput) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stuckRef = useRef(true);
  const forceStickRef = useRef(false);
  const jumpingRef = useRef(false);
  const preserveRef = useRef<{ height: number; top: number } | null>(null);
  const prevIdsRef = useRef<string[]>([]);
  const loadingRef = useRef(loadingOlder);
  loadingRef.current = loadingOlder;
  const [newCount, setNewCount] = useState(0);
  const [freshId, setFreshId] = useState<string | null>(null);

  useLayoutEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;
    const ids = [
      ...messages.map((message) => message.messageId ?? ''),
      ...pendings.map((pending) => pending.requestId),
    ];
    const previous = prevIdsRef.current;
    prevIdsRef.current = ids;
    if (preserveRef.current) {
      const snapshot = preserveRef.current;
      preserveRef.current = null;
      element.scrollTop = compensatePrepend(snapshot.height, element.scrollHeight, snapshot.top);
      return;
    }
    const ownSend = forceStickRef.current;
    forceStickRef.current = false;
    const appended =
      previous.length > 0 &&
      ids.length > previous.length &&
      previous.every((id, index) => ids[index] === id);
    if (
      shouldStickToBottom({
        stuck: stuckRef.current || previous.length === 0,
        jumping: jumpingRef.current,
        ownSend,
      })
    ) {
      element.scrollTop = element.scrollHeight;
      setNewCount(0);
      if (appended) setFreshId(ids.at(-1) ?? null);
      return;
    }
    if (appended) setNewCount((count) => count + (ids.length - previous.length));
  }, [messages, pendings]);

  async function loadOlderPreserving() {
    const element = scrollerRef.current;
    if (element) preserveRef.current = { height: element.scrollHeight, top: element.scrollTop };
    await loadOlder();
  }

  function onScroll() {
    const element = scrollerRef.current;
    if (!element || jumpingRef.current) return;
    const stuck = isStuckToBottom(element.scrollTop, element.scrollHeight, element.clientHeight);
    stuckRef.current = stuck;
    if (stuck) setNewCount(0);
    if (element.scrollTop < 48 && hasMore && !loadingRef.current) void loadOlderPreserving();
  }

  function jumpToBottom() {
    const element = scrollerRef.current;
    stuckRef.current = true;
    setNewCount(0);
    if (element) element.scrollTop = element.scrollHeight;
  }

  function stickNow() {
    forceStickRef.current = true;
    stuckRef.current = true;
    setNewCount(0);
  }

  function holdJump() {
    jumpingRef.current = true;
    stuckRef.current = false;
  }

  function releaseJump() {
    jumpingRef.current = false;
    const element = scrollerRef.current;
    if (!element) return;
    stuckRef.current = isStuckToBottom(
      element.scrollTop,
      element.scrollHeight,
      element.clientHeight,
    );
  }

  return {
    scrollerRef,
    newCount,
    freshId,
    onScroll,
    jumpToBottom,
    stickNow,
    loadOlderPreserving,
    holdJump,
    releaseJump,
  };
}
