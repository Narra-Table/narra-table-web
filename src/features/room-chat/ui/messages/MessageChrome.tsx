import { Pin } from 'lucide-react';
import { useState } from 'react';
import type { GithubComNarraTableBackendPkgProtocolMask } from '@/api/model/githubComNarraTableBackendPkgProtocolMask';
import { useResourceUrl } from '@/features/resources';
import { cn } from '@/lib/utils';
import { moreActions } from '../../model/moreActions';
import { formatSendTime, maskLabel, veilMarks } from '../../model/text';
import type { RoomMessage } from '../../model/types';
import { MorePanel } from './MorePanel';
import type { ReadingGroupsProps } from './types';

function maskResource(
  masks: GithubComNarraTableBackendPkgProtocolMask[],
  maskId: string | undefined,
): string | undefined {
  const mask = masks.find((item) => item.maskId === maskId);
  if (!mask?.currentAvatarId) return undefined;
  return mask.avatars?.[mask.currentAvatarId];
}

export function MessageHead(
  props: ReadingGroupsProps & { message: RoomMessage; revealed?: boolean },
) {
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

export function MetaLine({
  message,
  highlightId,
}: {
  message: RoomMessage;
  highlightId?: string | null;
}) {
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

export function TileActions(
  props: ReadingGroupsProps & { message: RoomMessage; revealed?: boolean },
) {
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
