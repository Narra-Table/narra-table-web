import type { ReactNode } from 'react';
import { cn } from '@/lib/classNames';
import { messageExcerpt } from '../../model/text';
import type { ReadingGroup } from '../../model/types';
import { BlockList } from './Blocks';
import { MessageHead, MetaLine, TileActions } from './MessageChrome';
import {
  ClueCard,
  CommandTile,
  DeletedLine,
  FoldedLine,
  ForwardCard,
  PendingTile,
} from './MessageTiles';
import type { ReadingGroupsProps } from './types';
import { usePressReveal } from './usePressReveal';

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

function GroupView(props: ReadingGroupsProps & { group: ReadingGroup }) {
  const { group } = props;
  if (group.kind === 'pending') {
    return (
      <PendingTile
        pending={group.pending}
        fresh={props.freshId === group.pending.requestId}
        onRetry={props.onRetry}
      />
    );
  }
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
