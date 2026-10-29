import { useCallback, useEffect, useRef, useState } from 'react';
import type { RoomMessage } from '../model/types';
import type { ReadingScrollController } from './useReadingScroll';

interface LocateOptions {
  ready: (messages: RoomMessage[]) => boolean;
  selector: string;
  highlight: string;
  missing: string;
}

interface MessageLocatorInput {
  messages: RoomMessage[];
  hasMore: boolean;
  scroll: ReadingScrollController;
}

function waitFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => {
      if (left <= 0) resolve();
      else requestAnimationFrame(() => step(left - 1));
    };
    step(count);
  });
}

export function useMessageLocator({ messages, hasMore, scroll }: MessageLocatorInput) {
  const [searching, setSearching] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const tokenRef = useRef(0);
  const messagesRef = useRef(messages);
  const hasMoreRef = useRef(hasMore);
  const scrollRef = useRef(scroll);
  messagesRef.current = messages;
  hasMoreRef.current = hasMore;
  scrollRef.current = scroll;

  useEffect(
    () => () => {
      tokenRef.current += 1;
    },
    [],
  );

  const locate = useCallback(async (options: LocateOptions) => {
    const token = tokenRef.current + 1;
    tokenRef.current = token;
    scrollRef.current.holdJump();
    setSearching(true);
    setNote(null);

    const finish = (found: boolean) => {
      if (tokenRef.current !== token) return;
      setSearching(false);
      setNote(found ? null : options.missing);
      setHighlightId(found ? options.highlight : null);
      if (found) {
        window.setTimeout(() => {
          if (tokenRef.current === token) {
            setHighlightId((current) => (current === options.highlight ? null : current));
          }
        }, 1600);
      }
      window.setTimeout(() => {
        if (tokenRef.current === token) scrollRef.current.releaseJump();
      }, 500);
    };

    for (let step = 0; step < 40; step += 1) {
      if (tokenRef.current !== token) return;
      if (options.ready(messagesRef.current)) {
        await waitFrames(2);
        if (tokenRef.current !== token) return;
        const target = scrollRef.current.scrollerRef.current?.querySelector(options.selector);
        if (target) {
          target.scrollIntoView({ block: 'center', inline: 'nearest' });
          finish(true);
          return;
        }
      }
      if (!hasMoreRef.current) break;
      const before = messagesRef.current[0]?.messageId;
      await scrollRef.current.loadOlderPreserving();
      await waitFrames(2);
      if (messagesRef.current[0]?.messageId === before) break;
    }
    finish(false);
  }, []);

  const cancel = useCallback(() => {
    tokenRef.current += 1;
  }, []);

  return { searching, note, highlightId, locate, cancel };
}
