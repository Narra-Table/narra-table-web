import { Pin } from 'lucide-react';
import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import type { GithubComNarraTableBackendPkgProtocolMask } from '@/api/model/githubComNarraTableBackendPkgProtocolMask';
import type { GithubComNarraTableBackendPkgProtocolMember } from '@/api/model/githubComNarraTableBackendPkgProtocolMember';
import type { GithubComNarraTableBackendPkgProtocolMemberRole } from '@/api/model/githubComNarraTableBackendPkgProtocolMemberRole';
import { useResourceUrl } from '@/features/resources';
import { cn } from '@/lib/utils';
import { moreActions } from '../../model/moreActions';
import { collectScenes } from '../../model/sceneIndex';
import { firstLine, formatSendTime, maskLabel, messageExcerpt, veilMarks } from '../../model/text';
import type { PendingMessage, ReadingGroup, RoomMessage } from '../../model/types';
import { BlockList, ParagraphText } from './Blocks';
import { ClueCardView } from './ClueCard';
import { ForwardBody } from './ForwardBody';
import { MorePanel, type VeilDraft } from './MorePanel';

interface ReadingGroupsProps {
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

export function ReadingGroups(props: ReadingGroupsProps) {
  return (
    <>
      {props.groups.map((group) => (
        <GroupView key={groupKey(group)} group={group} {...props} />
      ))}
    </>
  );
}

function groupKey(group: ReadingGroup): string {
  if (group.kind === 'pending') return `pending-${group.pending.requestId}`;
  if (group.kind === 'speech') return `speech-${group.messages[0]?.messageId ?? 'empty'}`;
  if (group.kind === 'command') return `command-${group.message.messageId}`;
  return `${group.kind}-${group.message.messageId}`;
}

function usePressReveal(): {
  revealed: boolean;
  bind: {
    onPointerDown: (event: PointerEvent) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
    onPointerLeave: () => void;
  };
} {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  return {
    revealed,
    bind: {
      onPointerDown: (event) => {
        if (event.pointerType === 'mouse') return;
        clear();
        timer.current = window.setTimeout(() => setRevealed(true), 500);
      },
      onPointerUp: clear,
      onPointerCancel: clear,
      onPointerLeave: clear,
    },
  };
}

function GroupView(props: ReadingGroupsProps & { group: ReadingGroup }) {
  const { group } = props;
  if (group.kind === 'pending')
    return (
      <PendingTile
        pending={group.pending}
        fresh={props.freshId === group.pending.requestId}
        onRetry={props.onRetry}
      />
    );
  if (group.kind === 'deleted') return <DeletedLine message={group.message} />;
  if (group.kind === 'folded') return <FoldedLine {...props} message={group.message} />;
  if (group.kind === 'system') {
    return (
      <p
        data-message-id={group.message.messageId}
        className="py-2 text-center text-xs text-text-muted"
      >
        {messageExcerpt(group.message)}
      </p>
    );
  }
  if (group.kind === 'clue') return <ClueCard {...props} message={group.message} />;
  if (group.kind === 'forward') return <ForwardCard {...props} message={group.message} />;
  if (group.kind === 'command') return <CommandTile {...props} group={group} />;
  const head = group.messages[0];
  if (!head) return null;
  return (
    <Pressable
      messageId={head.messageId}
      className={
        props.freshId === group.messages.at(-1)?.messageId
          ? 'animate-in fade-in duration-300'
          : undefined
      }
    >
      {(revealed) => (
        <>
          <MessageHead {...props} message={head} revealed={revealed} />
          <div className="mt-2 flex flex-col gap-2 pl-11">
            {group.messages.map((message, index) => (
              <div key={message.messageId} data-message-id={message.messageId}>
                {index > 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <MetaLine message={message} highlightId={props.highlightId} />
                    <TileActions {...props} message={message} revealed={revealed} />
                  </div>
                ) : null}
                <BlockList
                  blocks={message.content}
                  messageId={message.messageId ?? ''}
                  spaceId={props.spaceId}
                  highlightId={props.highlightId}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </Pressable>
  );
}

function Pressable({
  messageId,
  className,
  children,
}: {
  messageId?: string;
  className?: string;
  children: (revealed: boolean) => ReactNode;
}) {
  const press = usePressReveal();
  return (
    <article
      data-message-id={messageId}
      className={cn('group relative', className)}
      {...press.bind}
    >
      {children(press.revealed)}
    </article>
  );
}

function maskResource(
  masks: GithubComNarraTableBackendPkgProtocolMask[],
  maskId: string | undefined,
): string | undefined {
  const mask = masks.find((item) => item.maskId === maskId);
  if (!mask?.currentAvatarId) return undefined;
  return mask.avatars?.[mask.currentAvatarId];
}

function MessageHead(props: ReadingGroupsProps & { message: RoomMessage; revealed?: boolean }) {
  const name = maskLabel(props.maskNames, props.message.sender?.maskId);
  const resourceId = maskResource(props.masks, props.message.sender?.maskId);
  return (
    <div className="flex items-start gap-3">
      <MaskAvatar spaceId={props.spaceId} resourceId={resourceId} name={name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-text">{name}</span>
          <MetaLine message={props.message} highlightId={props.highlightId} />
        </div>
      </div>
      <TileActions {...props} message={props.message} revealed={props.revealed} />
    </div>
  );
}

function MetaLine({ message, highlightId }: { message: RoomMessage; highlightId?: string | null }) {
  const marks = veilMarks(message.veil);
  const edited = (message.editHistory?.length ?? 0) > 0;
  return (
    <span
      className={cn(
        'flex flex-wrap items-center gap-2 text-xs text-text-muted',
        highlightId === message.messageId && 'rounded-control bg-surface-muted px-2',
      )}
    >
      <time dateTime={message.sendTime}>{formatSendTime(message.sendTime)}</time>
      {edited ? <span>已编辑</span> : null}
      {message.pinned ? (
        <span className="inline-flex items-center gap-1">
          <Pin className="size-3" />
          置顶
        </span>
      ) : null}
      {marks.map((mark) => (
        <span key={mark}>{mark}</span>
      ))}
    </span>
  );
}

function MaskAvatar({
  spaceId,
  resourceId,
  name,
}: {
  spaceId: string;
  resourceId?: string;
  name: string;
}) {
  const media = useResourceUrl(spaceId, resourceId);
  return (
    <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-xs font-semibold text-text">
      {media.url ? (
        <img src={media.url} alt="" className="size-full object-cover" />
      ) : (
        name.slice(0, 1)
      )}
    </div>
  );
}

function TileActions(props: ReadingGroupsProps & { message: RoomMessage; revealed?: boolean }) {
  const [open, setOpen] = useState(false);
  const actions = moreActions({
    role: props.role,
    userId: props.userId,
    senderId: props.message.sender?.userId,
    messageType: props.message.type,
  });
  if (!props.canSend && !actions.panel) return null;
  return (
    <div
      className={cn(
        'flex items-center gap-2 opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100',
        (props.revealed || open) && 'pointer-events-auto opacity-100',
      )}
    >
      {props.canSend ? (
        <button
          type="button"
          className="rounded-control px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-muted hover:text-text"
          onClick={() => props.onReply(props.message)}
        >
          回复
        </button>
      ) : null}
      <MorePanel
        message={props.message}
        role={props.role}
        userId={props.userId}
        members={props.members}
        spaceId={props.spaceId}
        onOpenChange={setOpen}
        onEdit={() => props.onEdit(props.message)}
        onPin={() => props.onPin(props.message)}
        onFold={() => props.onFold(props.message)}
        onDelete={() => props.onDelete(props.message)}
        onVeil={(draft) => props.onVeil(props.message, draft)}
      />
    </div>
  );
}

function DeletedLine({ message }: { message: RoomMessage }) {
  return (
    <p data-message-id={message.messageId} className="text-sm text-text-muted">
      此内容已删除
    </p>
  );
}

function FoldedLine(props: ReadingGroupsProps & { message: RoomMessage }) {
  const name = maskLabel(props.maskNames, props.message.sender?.maskId);
  const scenes = collectScenes([props.message]);
  const press = usePressReveal();
  return (
    <div
      data-message-id={props.message.messageId}
      className="group relative flex items-center gap-3 text-sm text-text-muted"
      {...press.bind}
    >
      {scenes.map((scene) => (
        <span key={scene.id} data-scene={scene.id} className="block h-0 overflow-hidden" />
      ))}
      <span className="font-medium text-text">{name}</span>
      <span className="min-w-0 flex-1 truncate">{firstLine(messageExcerpt(props.message))}</span>
      <button
        type="button"
        className="rounded-control px-3 py-1.5 text-xs font-medium text-accent"
        onClick={() => props.onFold(props.message)}
      >
        展开
      </button>
      <TileActions {...props} message={props.message} revealed={press.revealed} />
    </div>
  );
}

function ClueCard(props: ReadingGroupsProps & { message: RoomMessage }) {
  const press = usePressReveal();
  const name = maskLabel(props.maskNames, props.message.sender?.maskId);
  return (
    <article data-message-id={props.message.messageId} className="group relative" {...press.bind}>
      <ClueCardView
        clue={props.message.clue}
        spaceId={props.spaceId}
        actions={<TileActions {...props} message={props.message} revealed={press.revealed} />}
        footer={
          <>
            <span className="text-xs font-medium text-text">{name}</span>
            <MetaLine message={props.message} highlightId={props.highlightId} />
          </>
        }
      />
    </article>
  );
}

function ForwardCard(props: ReadingGroupsProps & { message: RoomMessage }) {
  const forward = props.message.forward;
  const press = usePressReveal();
  return (
    <article
      data-message-id={props.message.messageId}
      className="group relative rounded-card border border-border-subtle bg-surface p-4"
      {...press.bind}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text">{forward?.title || '合并转发'}</h3>
          {forward?.sourceDesc ? (
            <p className="text-sm text-text-muted">{forward.sourceDesc}</p>
          ) : null}
        </div>
        <TileActions {...props} message={props.message} revealed={press.revealed} />
      </div>
      <ForwardBody forward={forward} spaceId={props.spaceId} maskNames={props.maskNames} />
    </article>
  );
}

function CommandTile(
  props: ReadingGroupsProps & { group: Extract<ReadingGroup, { kind: 'command' }> },
) {
  const { message, embedded, jumpToId } = props.group;
  const press = usePressReveal();
  return (
    <article
      data-message-id={message.messageId}
      className="group relative rounded-card border border-border-subtle bg-surface p-4"
      {...press.bind}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-medium text-text">{message.raw}</p>
          <MetaLine message={message} highlightId={props.highlightId} />
        </div>
        <TileActions {...props} message={message} revealed={press.revealed} />
      </div>
      {message.result?.error ? (
        <p className="mt-3 text-sm text-danger">{message.result.error}</p>
      ) : null}
      {embedded ? (
        <div
          data-message-id={embedded.messageId}
          className="mt-4 border-t border-border-subtle pt-4"
        >
          <p className="text-sm font-semibold text-text">
            {maskLabel(props.maskNames, embedded.sender?.maskId)}
          </p>
          <BlockList
            blocks={embedded.content}
            messageId={embedded.messageId ?? ''}
            spaceId={props.spaceId}
            highlightId={props.highlightId}
          />
        </div>
      ) : null}
      {jumpToId ? (
        <button
          type="button"
          className="mt-3 text-sm font-medium text-accent"
          onClick={() => props.onJump(jumpToId)}
        >
          查看回复
        </button>
      ) : null}
    </article>
  );
}

function PendingTile({
  pending,
  fresh,
  onRetry,
}: {
  pending: PendingMessage;
  fresh: boolean;
  onRetry: (requestId: string) => void;
}) {
  const status =
    pending.status === 'pending'
      ? '发送中'
      : pending.status === 'unconfirmed'
        ? '未确认，没有自动重发'
        : pending.error || '发送失败';
  return (
    <article className={cn('text-base text-text', fresh && 'animate-in fade-in duration-300')}>
      {pending.draft.reply ? (
        <blockquote className="mb-2 rounded-control bg-surface-muted px-4 py-2 text-sm text-text-muted">
          {pending.draft.reply.preview.textSnippet}
        </blockquote>
      ) : null}
      <p className="whitespace-pre-wrap">
        {pending.draft.nodes?.length ? (
          <ParagraphText runs={pending.draft.nodes} />
        ) : (
          pending.draft.text
        )}
      </p>
      <p className="mt-1 text-xs text-text-muted">{status}</p>
      {pending.status !== 'pending' ? (
        <button
          type="button"
          className="mt-2 text-sm font-medium text-accent"
          onClick={() => onRetry(pending.requestId)}
        >
          重试
        </button>
      ) : null}
    </article>
  );
}
