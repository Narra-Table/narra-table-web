import { cn } from '@/lib/classNames';
import { collectScenes } from '../../model/sceneIndex';
import { firstLine, maskLabel, messageExcerpt } from '../../model/text';
import type { PendingMessage, ReadingGroup, RoomMessage } from '../../model/types';
import { BlockList, ParagraphText } from './Blocks';
import { ClueCardView } from './ClueCard';
import { ForwardBody } from './ForwardBody';
import { MetaLine, TileActions } from './MessageChrome';
import type { ReadingGroupsProps } from './types';
import { usePressReveal } from './usePressReveal';

export function DeletedLine({ message }: { message: RoomMessage }) {
  return (
    <p data-message-id={message.messageId} className="text-sm text-text-muted">
      此内容已删除
    </p>
  );
}

export function FoldedLine(props: ReadingGroupsProps & { message: RoomMessage }) {
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

export function ClueCard(props: ReadingGroupsProps & { message: RoomMessage }) {
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

export function ForwardCard(props: ReadingGroupsProps & { message: RoomMessage }) {
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

export function CommandTile(
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

export function PendingTile({
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
