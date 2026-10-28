import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { GithubComNarraTableBackendPkgProtocolClueContent } from '@/api/model/githubComNarraTableBackendPkgProtocolClueContent';
import { cn } from '@/lib/classNames';
import { MediaImage, ZoomImage } from './Blocks';

function directUrl(value: string | undefined): boolean {
  return Boolean(value && /^(https?:|blob:|data:)/.test(value));
}

export function ClueCardView({
  clue,
  spaceId,
  footer,
  actions,
}: {
  clue: GithubComNarraTableBackendPkgProtocolClueContent | undefined;
  spaceId: string;
  footer?: ReactNode;
  actions?: ReactNode;
}) {
  const title = clue?.title?.trim() ? clue.title : '未命名线索';
  const description = clue?.description ?? '';
  const [expanded, setExpanded] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const node = bodyRef.current;
    if (!node || expanded) return;
    setOverflow(node.scrollHeight > node.clientHeight + 1);
  }, [description, expanded]);

  return (
    <div className="rounded-card border border-border-subtle bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-lg font-semibold text-text">{title}</h3>
            <span className={cn('text-sm', clue?.isDiscovered ? 'text-success' : 'text-warning')}>
              {clue?.isDiscovered ? '已发现' : '未发现'}
            </span>
          </div>
          {clue?.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {clue.tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="rounded-sm bg-surface-muted px-3 py-1.5 text-xs text-text"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {actions}
      </div>
      {description ? (
        <p
          ref={bodyRef}
          className={cn(
            'mt-3 whitespace-pre-wrap text-base text-text',
            !expanded && 'line-clamp-4',
          )}
        >
          {description}
        </p>
      ) : null}
      {description && (overflow || expanded) ? (
        <button
          type="button"
          className="mt-2 text-sm font-medium text-accent"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? '收起' : '展开全文'}
        </button>
      ) : null}
      {clue?.imageUrl ? (
        <div className="mt-3">
          {directUrl(clue.imageUrl) ? (
            <ZoomImage src={clue.imageUrl} />
          ) : (
            <MediaImage spaceId={spaceId} resourceId={clue.imageUrl} />
          )}
        </div>
      ) : null}
      {footer ? <div className="mt-4 flex flex-wrap items-center gap-2">{footer}</div> : null}
    </div>
  );
}
