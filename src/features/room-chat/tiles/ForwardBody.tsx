import type { GithubComNarraTableBackendPkgProtocolForwardContent } from '@/api/model/githubComNarraTableBackendPkgProtocolForwardContent';
import {
  forwardChildView,
  messageTypeLabel,
  orderForwardChildren,
  type ForwardChild,
} from '../model/forwardChildren';
import { formatSendTime, maskLabel, veilMarks } from '../model/text';
import { BlockList } from './Blocks';
import { ClueCardView } from './ClueCard';

export function ForwardBody({
  forward,
  spaceId,
  maskNames,
  depth = 0,
}: {
  forward: GithubComNarraTableBackendPkgProtocolForwardContent | undefined;
  spaceId: string;
  maskNames: ReadonlyMap<string, string>;
  depth?: number;
}) {
  const children = orderForwardChildren((forward?.messages ?? []) as ForwardChild[]);
  if (!children.length) return null;
  return (
    <div className="mt-4 flex flex-col gap-4">
      {children.map((child, index) => (
        <ForwardChildTile
          key={`${child.seq ?? 'order'}-${child.sourceMessageId ?? index}`}
          child={child}
          spaceId={spaceId}
          maskNames={maskNames}
          depth={depth}
          index={index}
        />
      ))}
    </div>
  );
}

function ForwardChildTile({
  child,
  spaceId,
  maskNames,
  depth,
  index,
}: {
  child: ForwardChild;
  spaceId: string;
  maskNames: ReadonlyMap<string, string>;
  depth: number;
  index: number;
}) {
  const view = forwardChildView(child);
  const name = child.senderName || maskLabel(maskNames, child.senderMaskId);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-text">{name}</p>
      {view === 'omitted' ? (
        <p className="text-sm text-text-muted">更早的合并转发没有装进这条快照</p>
      ) : null}
      {view === 'sender-only' ? (
        <p className="text-sm text-text-muted">{messageTypeLabel(child.type)}</p>
      ) : null}
      {view === 'body' && child.type === 'clue' ? (
        <ClueCardView
          clue={child.clue}
          spaceId={spaceId}
          footer={
            <p className="text-xs text-text-muted">
              <span className="font-medium text-text">{name}</span>
              {child.timestamp ? (
                <span className="ml-2">{formatSendTime(child.timestamp)}</span>
              ) : null}
              {veilMarks(child.veil).map((mark) => (
                <span key={mark} className="ml-2">
                  {mark}
                </span>
              ))}
            </p>
          }
        />
      ) : null}
      {view === 'body' && child.type === 'command' ? (
        <div>
          <p className="text-base font-medium text-text">{child.raw}</p>
          {child.result?.error ? (
            <p className="mt-2 text-sm text-danger">{child.result.error}</p>
          ) : null}
        </div>
      ) : null}
      {view === 'body' && child.type === 'forward' && child.forward && depth < 8 ? (
        <div className="rounded-card border border-border-subtle bg-surface p-4">
          <p className="text-base font-semibold text-text">{child.forward.title || '合并转发'}</p>
          <ForwardBody
            forward={child.forward}
            spaceId={spaceId}
            maskNames={maskNames}
            depth={depth + 1}
          />
        </div>
      ) : null}
      {view === 'body' &&
      child.type !== 'clue' &&
      child.type !== 'command' &&
      child.type !== 'forward' ? (
        <BlockList
          blocks={child.blocks}
          messageId={`forward-copy-${depth}-${index}`}
          spaceId={spaceId}
        />
      ) : null}
    </div>
  );
}
