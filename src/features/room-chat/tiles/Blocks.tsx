import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { paintCustomColor, readableTextColor } from '../model/contrast';
import {
  THEME_BG_CLASS,
  THEME_TEXT_CLASS,
  isThemeColor,
  normalizeColor,
  type StyledInline,
} from '../model/richText';
import { sceneId, sceneLabel } from '../model/sceneIndex';
import type { RoomBlock } from '../model/types';
import { useThemePalette, type ThemePalette } from '../useThemePalette';
import { useResourceUrl } from './useResourceUrl';

function directUrl(value: string | undefined): boolean {
  return Boolean(value && /^(https?:|blob:|data:)/.test(value));
}

export function MediaImage({
  spaceId,
  resourceId,
  alt,
}: {
  spaceId: string;
  resourceId: string | undefined;
  alt?: string;
}) {
  const direct = directUrl(resourceId);
  const media = useResourceUrl(spaceId, direct ? undefined : resourceId);
  if (!resourceId) return null;
  if (!direct && media.failed) {
    return <p className="text-sm text-danger">图片没有加载出来</p>;
  }
  const src = direct ? resourceId : media.url;
  if (!src) return <p className="text-sm text-text-muted">图片加载中</p>;
  return <ZoomImage src={src} alt={alt} />;
}

export function ZoomImage({ src, alt }: { src: string; alt?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <>
      <button type="button" className="block w-full" onClick={() => setOpen(true)}>
        <img src={src} alt={alt || ''} className="max-h-80 w-full rounded-card object-contain" />
      </button>
      {open ? (
        <button
          type="button"
          aria-label="关闭大图"
          className="fixed inset-0 z-50 flex items-center justify-center bg-app-bg p-8"
          onClick={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
        >
          <img
            src={src}
            alt={alt || ''}
            className="max-h-full max-w-full rounded-card object-contain"
          />
        </button>
      ) : null}
    </>
  );
}

export function MediaAudio({
  spaceId,
  resourceId,
  title,
}: {
  spaceId: string;
  resourceId: string | undefined;
  title?: string;
}) {
  const media = useResourceUrl(spaceId, resourceId);
  if (!resourceId) return null;
  if (media.failed) return <p className="text-sm text-danger">音频没有加载出来</p>;
  if (!media.url) return <p className="text-sm text-text-muted">音频加载中</p>;
  return (
    <div className="flex flex-col gap-2">
      {title ? <p className="text-sm font-medium text-text">{title}</p> : null}
      <audio controls src={media.url} className="w-full" />
    </div>
  );
}

function InlineRun({ child, palette }: { child: StyledInline; palette: ThemePalette }) {
  if (child.type === 'mention') {
    return <span className="text-accent">{child.displayText || '提及'}</span>;
  }
  if (child.type === 'face') {
    return <span className="text-text-muted">{child.faceId || '表情'}</span>;
  }
  const color = normalizeColor(child.color);
  const fill = normalizeColor(child.background);
  const named = color && isThemeColor(color) ? THEME_TEXT_CLASS[color] : undefined;
  const namedFill = fill && isThemeColor(fill) ? THEME_BG_CLASS[fill] : undefined;
  const fillHex = fill ? (isThemeColor(fill) ? palette[fill] : fill) : undefined;
  const textHex = color ? (isThemeColor(color) ? palette[color] : color) : undefined;
  // 有底色时，正文色和主题色也按底色重新取对比度；没有底色时保持原来的渲染。
  const painted = fillHex
    ? textHex
      ? paintCustomColor(textHex, fillHex)
      : readableTextColor(fillHex)
    : color && !named
      ? paintCustomColor(color, palette.appBg)
      : undefined;
  const body = (
    <span
      className={cn(
        child.bold && 'font-semibold',
        child.italic && 'italic',
        child.underline && 'underline',
        child.strikethrough && 'line-through',
        named,
        namedFill,
        fill && 'rounded-sm px-0.5',
      )}
      style={{
        ...(painted ? { color: painted } : undefined),
        ...(fill && !namedFill ? { backgroundColor: fill } : undefined),
      }}
    >
      {child.text}
    </span>
  );
  if (!child.ruby) return body;
  return (
    <span className="inline-flex flex-col items-center align-bottom">
      <span className="text-2xs leading-none text-text-muted">{child.ruby}</span>
      {body}
    </span>
  );
}

export function ParagraphText({ runs }: { runs: StyledInline[] | undefined }) {
  const palette = useThemePalette();
  return (
    <>
      {(runs ?? []).map((child, index) => (
        <InlineRun key={index} child={child} palette={palette} />
      ))}
    </>
  );
}

function Paragraph({ block }: { block: RoomBlock }) {
  return (
    <p className="whitespace-pre-wrap text-base text-text">
      <ParagraphText runs={block.children} />
    </p>
  );
}

export function BlockView({
  block,
  index,
  messageId,
  spaceId,
  highlighted,
}: {
  block: RoomBlock;
  index: number;
  messageId: string;
  spaceId: string;
  highlighted: boolean;
}) {
  let body: ReactNode = null;
  if (block.type === 'paragraph') body = <Paragraph block={block} />;
  if (block.type === 'image') {
    body = (
      <div className="rounded-card border border-border-subtle bg-surface p-4">
        <MediaImage spaceId={spaceId} resourceId={block.resourceId} alt={block.alt} />
      </div>
    );
  }
  if (block.type === 'audio') {
    body = (
      <div className="rounded-card border border-border-subtle bg-surface p-4">
        <MediaAudio spaceId={spaceId} resourceId={block.resourceId} title={block.title} />
      </div>
    );
  }
  if (block.type === 'table') {
    body = (
      <div className="overflow-x-auto rounded-card border border-border-subtle bg-surface p-4">
        <table className="w-full border-collapse text-sm">
          {block.caption ? (
            <caption className="mb-2 text-left text-text-muted">{block.caption}</caption>
          ) : null}
          {block.headers?.length ? (
            <thead>
              <tr>
                {block.headers.map((header) => (
                  <th
                    key={header}
                    className="border border-border-subtle px-3 py-1.5 text-left font-medium"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>
            {(block.rows ?? []).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border border-border-subtle px-3 py-1.5">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.type === 'reply') {
    body = (
      <blockquote className="rounded-control bg-surface-muted px-4 py-2 text-sm text-text-muted">
        <p className="font-medium text-text">{block.preview?.senderName || '引用'}</p>
        <p>{block.preview?.textSnippet || ''}</p>
      </blockquote>
    );
  }
  if (block.type === 'divider') {
    const id = sceneId(messageId, index);
    body = (
      <div
        data-scene={id}
        className={cn(
          'flex items-center gap-3 py-8 text-xs text-text-muted',
          highlighted && 'rounded-control bg-surface-muted px-3',
        )}
      >
        <span className="h-px flex-1 bg-border-subtle" />
        <span>{sceneLabel(block.label)}</span>
        <span className="h-px flex-1 bg-border-subtle" />
      </div>
    );
  }
  if (!body) return null;
  return <div className={block.type === 'divider' ? undefined : 'py-1'}>{body}</div>;
}

export function BlockList({
  blocks,
  messageId,
  spaceId,
  highlightId,
}: {
  blocks: RoomBlock[] | undefined;
  messageId: string;
  spaceId: string;
  highlightId?: string | null;
}) {
  return (
    <div className="flex flex-col">
      {(blocks ?? []).map((block, index) => (
        <BlockView
          key={`${messageId}-${index}`}
          block={block}
          index={index}
          messageId={messageId}
          spaceId={spaceId}
          highlighted={highlightId === sceneId(messageId, index)}
        />
      ))}
    </div>
  );
}
