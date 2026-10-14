import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/orvalClient';
import { Composer } from './Composer';
import { groupMessages, streamEntries } from './model/groupMessages';
import { textNodesFromBlocks } from './model/richText';
import { collectScenes, findScene } from './model/sceneIndex';
import { maskLabel, messageExcerpt } from './model/text';
import type { RoomMessage, StagedReply, TextRun } from './model/types';
import { PinStrip } from './PinStrip';
import { SceneMenu } from './SceneMenu';
import { useRoomChatSession } from './session/useRoomChatSession';
import { ReadingGroups } from './tiles/ReadingGroups';
import { useReadingScroll } from './useReadingScroll';

function waitFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => {
      if (left <= 0) resolve();
      else requestAnimationFrame(() => step(left - 1));
    };
    step(count);
  });
}

export function RoomChat({
  spaceId,
  roomId,
  scene,
  onSceneChange,
}: {
  spaceId: string;
  roomId: string;
  scene?: string;
  onSceneChange: (sceneId: string) => void;
}) {
  const session = useRoomChatSession(spaceId, roomId);
  const scroll = useReadingScroll({
    messages: session.messages,
    pendings: session.pendings,
    hasMore: session.hasMore,
    loadingOlder: session.loadingOlder,
    loadOlder: session.loadOlder,
  });
  const [reply, setReply] = useState<StagedReply | null>(null);
  const [editing, setEditing] = useState<{ messageId: string; nodes: TextRun[] } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [locateNote, setLocateNote] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const jumpToken = useRef(0);
  const messagesRef = useRef(session.messages);
  messagesRef.current = session.messages;
  const hasMoreRef = useRef(session.hasMore);
  hasMoreRef.current = session.hasMore;

  async function locate(options: {
    ready: (messages: RoomMessage[]) => boolean;
    selector: string;
    highlight: string;
    missing: string;
  }) {
    const token = jumpToken.current + 1;
    jumpToken.current = token;
    scroll.holdJump();
    setSearching(true);
    setLocateNote(null);
    const finish = (found: boolean) => {
      if (jumpToken.current !== token) return;
      setSearching(false);
      setLocateNote(found ? null : options.missing);
      setHighlightId(found ? options.highlight : null);
      if (found) {
        window.setTimeout(() => {
          if (jumpToken.current === token)
            setHighlightId((current) => (current === options.highlight ? null : current));
        }, 1600);
      }
      window.setTimeout(() => {
        if (jumpToken.current === token) scroll.releaseJump();
      }, 500);
    };

    for (let step = 0; step < 40; step += 1) {
      if (jumpToken.current !== token) return;
      if (options.ready(messagesRef.current)) {
        await waitFrames(2);
        if (jumpToken.current !== token) return;
        const target = scroll.scrollerRef.current?.querySelector(options.selector);
        if (target) {
          target.scrollIntoView({ block: 'center', inline: 'nearest' });
          finish(true);
          return;
        }
      }
      if (!hasMoreRef.current) break;
      const before = messagesRef.current[0]?.messageId;
      await scroll.loadOlderPreserving();
      await waitFrames(2);
      if (messagesRef.current[0]?.messageId === before) break;
    }
    finish(false);
  }

  const locateRef = useRef(locate);
  locateRef.current = locate;

  useEffect(() => {
    setEditing(null);
    setReply(null);
  }, [roomId, spaceId]);

  useEffect(() => {
    if (!scene || session.loading) return;
    void locateRef.current({
      ready: (messages) => findScene(collectScenes(messages), scene) !== undefined,
      selector: `[data-scene="${CSS.escape(scene)}"]`,
      highlight: scene,
      missing: '找不到这个幕标',
    });
    return () => {
      jumpToken.current += 1;
    };
  }, [scene, session.loading]);

  function chooseScene(sceneId: string) {
    if (sceneId !== scene) onSceneChange(sceneId);
    else {
      void locate({
        ready: (messages) => findScene(collectScenes(messages), sceneId) !== undefined,
        selector: `[data-scene="${CSS.escape(sceneId)}"]`,
        highlight: sceneId,
        missing: '找不到这个幕标',
      });
    }
  }

  function jumpToMessage(messageId: string) {
    void locate({
      ready: (messages) => messages.some((message) => message.messageId === messageId),
      selector: `[data-message-id="${CSS.escape(messageId)}"]`,
      highlight: messageId,
      missing: '找不到这条消息',
    });
  }

  async function runAction(action: () => Promise<void>) {
    try {
      await action();
      setNotice(null);
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : '操作没有完成');
    }
  }

  function stageReply(message: RoomMessage) {
    if (!session.canSend || !message.messageId) return;
    const snippet = message.deleted ? '此内容已删除' : messageExcerpt(message).slice(0, 80) || '…';
    setReply({
      messageId: message.messageId,
      preview: {
        senderName: maskLabel(session.maskNames, message.sender?.maskId),
        textSnippet: snippet,
      },
    });
  }

  const groups = groupMessages(streamEntries(session.messages, session.pendings));
  const scenes = collectScenes(session.messages);
  const connectionLabel =
    session.connection === 'reconnecting'
      ? '正在重连'
      : session.connection === 'offline'
        ? '连接已断开'
        : session.connection === 'connecting' && !session.loading
          ? '正在连接'
          : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-app-bg">
      <PinStrip pins={session.pinned} onJump={jumpToMessage} />
      <SceneMenu
        scenes={scenes}
        activeId={scene}
        searching={searching}
        note={locateNote}
        onSelect={chooseScene}
      />
      <div className="relative min-h-0 flex-1">
        <div ref={scroll.scrollerRef} onScroll={scroll.onScroll} className="h-full overflow-y-auto">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
            {session.loadingOlder ? (
              <p className="text-center text-xs text-text-muted">正在接上更早的记录</p>
            ) : null}
            {session.loading ? <HistorySkeleton /> : null}
            {!session.loading && session.error ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-danger">{session.error}</p>
                <button
                  type="button"
                  className="rounded-control bg-surface px-4 py-2 text-sm font-medium text-text"
                  onClick={session.retryLoad}
                >
                  重试
                </button>
              </div>
            ) : null}
            {!session.loading &&
            !session.error &&
            session.messages.length === 0 &&
            session.pendings.length === 0 ? (
              <p className="text-sm text-text-muted">这里还没有发言</p>
            ) : null}
            {!session.loading && !session.error ? (
              <ReadingGroups
                groups={groups}
                masks={session.masks}
                maskNames={session.maskNames}
                spaceId={spaceId}
                userId={session.userId}
                role={session.role}
                members={session.members}
                canSend={session.canSend}
                canUseGmVeil={session.canUseGmVeil}
                highlightId={highlightId}
                freshId={scroll.freshId}
                onReply={stageReply}
                onPin={(message) => void runAction(() => session.pin(message))}
                onFold={(message) => void runAction(() => session.fold(message))}
                onDelete={(message) => void runAction(() => session.remove(message))}
                onEdit={(message) => {
                  if (!message.messageId) return;
                  setReply(null);
                  setEditing({
                    messageId: message.messageId,
                    nodes: textNodesFromBlocks(message.content),
                  });
                }}
                onVeil={(message, draft) =>
                  void runAction(() => session.updateVeil(message, draft))
                }
                onJump={jumpToMessage}
                onRetry={session.retryPending}
              />
            ) : null}
          </div>
        </div>
        {scroll.newCount > 0 ? (
          <button
            type="button"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-card bg-surface px-4 py-2 text-sm font-medium text-accent"
            onClick={scroll.jumpToBottom}
          >
            {scroll.newCount} 条新消息
          </button>
        ) : null}
      </div>
      {connectionLabel ? (
        <p className="px-4 text-center text-xs text-text-muted">{connectionLabel}</p>
      ) : null}
      {notice ? <p className="px-4 text-center text-xs text-danger">{notice}</p> : null}
      <Composer
        masks={session.usableMasks}
        maskId={session.maskId}
        onMaskId={session.setMaskId}
        veil={session.veil}
        onVeil={session.setVeil}
        canSend={session.canSend}
        canUseGmVeil={session.canUseGmVeil}
        loading={session.loading}
        reply={reply}
        onClearReply={() => setReply(null)}
        editing={editing}
        onCancelEdit={() => setEditing(null)}
        onSubmit={(payload) => {
          scroll.stickNow();
          session.send(payload, reply ?? undefined);
          setReply(null);
        }}
        onSave={(payload) => {
          if (!editing) return;
          const messageId = editing.messageId;
          void runAction(async () => {
            await session.edit(messageId, payload.nodes);
            setEditing(null);
          });
        }}
      />
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      {['一', '二', '三'].map((label) => (
        <div key={label} className="flex flex-col gap-2">
          <div className="h-4 w-24 rounded-control bg-surface-muted" />
          <div className="h-4 w-full rounded-control bg-surface-muted" />
          <div className="h-4 w-2/3 rounded-control bg-surface-muted" />
        </div>
      ))}
    </div>
  );
}
