import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GithubComNarraTableBackendPkgProtocolMember } from '@/api/model/githubComNarraTableBackendPkgProtocolMember';
import type { GithubComNarraTableBackendPkgProtocolMemberRole } from '@/api/model/githubComNarraTableBackendPkgProtocolMemberRole';
import { useMediaQuery } from '@/lib/react';
import { cn } from '@/lib/utils';
import { messagePlainText } from '../../model/copyText';
import { newestEditRecords, readPreviousRaw } from '../../model/editHistory';
import { moreActions } from '../../model/moreActions';
import { formatSendTime } from '../../model/text';
import type { RoomMessage, VeilDraft } from '../../model/types';
import { BlockList } from './Blocks';
import { ClueCardView } from './ClueCard';

const VEIL_OPTIONS: { value: VeilDraft['visibility']; label: string }[] = [
  { value: 'all', label: '全员' },
  { value: 'gm_only', label: '仅 GM' },
  { value: 'custom', label: '指定可见' },
  { value: 'gm_and_custom', label: '主持与指定成员' },
];

export function MorePanel({
  message,
  role,
  userId,
  members,
  spaceId,
  onOpenChange,
  onEdit,
  onPin,
  onFold,
  onDelete,
  onVeil,
}: {
  message: RoomMessage;
  role: GithubComNarraTableBackendPkgProtocolMemberRole | null;
  userId: string | null;
  members: GithubComNarraTableBackendPkgProtocolMember[];
  spaceId: string;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onPin: () => void;
  onFold: () => void;
  onDelete: () => void;
  onVeil: (draft: VeilDraft) => void;
}) {
  const actions = moreActions({
    role,
    userId,
    senderId: message.sender?.userId,
    messageType: message.type,
  });
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'actions' | 'history' | 'veil'>('actions');
  const [confirming, setConfirming] = useState(false);
  const [veil, setVeil] = useState<VeilDraft>({
    visibility: message.veil?.visibility ?? 'all',
    visibleTo: message.veil?.visibleTo ?? [],
    revealOnSpaceClose: Boolean(message.veil?.revealOnSpaceClose),
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const narrow = useMediaQuery('(max-width: 640px)');
  const [box, setBox] = useState<{ top?: number; bottom?: number; right: number } | null>(null);

  const closeRef = useRef<() => void>(() => {});
  const placeRef = useRef<() => void>(() => {});

  function setPanel(next: boolean) {
    setOpen(next);
    onOpenChange(next);
    if (!next) {
      setView('actions');
      setConfirming(false);
    }
  }
  closeRef.current = () => setPanel(false);

  function place() {
    const button = buttonRef.current;
    if (!button || narrow) {
      setBox(null);
      return;
    }
    const rect = button.getBoundingClientRect();
    const up = window.innerHeight - rect.bottom < 280;
    setBox({
      top: up ? undefined : rect.bottom + 8,
      bottom: up ? window.innerHeight - rect.top + 8 : undefined,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }
  placeRef.current = place;

  useEffect(() => {
    if (open) placeRef.current();
  }, [open, narrow]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeRef.current();
    }
    function onPointer(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      closeRef.current();
    }
    function onResize() {
      placeRef.current();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  if (!actions.panel) return null;

  const needsAudience = veil.visibility === 'custom' || veil.visibility === 'gm_and_custom';
  const records = newestEditRecords(message.editHistory);
  const body = (
    <div className="flex max-h-96 flex-col gap-1 overflow-y-auto p-2">
      {view === 'actions' ? (
        <>
          {actions.copy ? (
            <PanelButton
              label="复制"
              onClick={() => {
                void navigator.clipboard
                  .writeText(messagePlainText(message))
                  .then(() => setPanel(false))
                  .catch(() => undefined);
              }}
            />
          ) : null}
          {actions.history ? (
            <PanelButton label="编辑记录" onClick={() => setView('history')} />
          ) : null}
          {actions.edit ? (
            <PanelButton
              label="编辑"
              onClick={() => {
                setPanel(false);
                onEdit();
              }}
            />
          ) : null}
          {actions.pin ? (
            <PanelButton
              label={message.pinned ? '取消置顶' : '置顶'}
              onClick={() => {
                setPanel(false);
                onPin();
              }}
            />
          ) : null}
          {actions.fold ? (
            <PanelButton
              label={message.folded ? '展开' : '折叠'}
              onClick={() => {
                setPanel(false);
                onFold();
              }}
            />
          ) : null}
          {actions.veil ? <PanelButton label="帷幕" onClick={() => setView('veil')} /> : null}
          {actions.remove ? (
            <PanelButton
              label={confirming ? '确认删除' : '删除'}
              danger={confirming}
              onClick={() => {
                if (!confirming) {
                  setConfirming(true);
                  return;
                }
                setPanel(false);
                onDelete();
              }}
            />
          ) : null}
        </>
      ) : null}
      {view === 'history' ? (
        <div className="flex flex-col gap-3">
          <PanelButton label="返回" onClick={() => setView('actions')} />
          {records.length === 0 ? (
            <p className="px-3 py-1.5 text-sm text-text-muted">还没有编辑记录</p>
          ) : null}
          {records.map((record, index) => (
            <div
              key={`${record.editTime ?? 'record'}-${index}`}
              className="flex flex-col gap-2 px-3"
            >
              <p className="text-xs text-text-muted">
                {formatSendTime(record.editTime) || '更早的版本'}
              </p>
              <PreviousBody raw={record.previousRaw} spaceId={spaceId} index={index} />
            </div>
          ))}
        </div>
      ) : null}
      {view === 'veil' ? (
        <div className="flex flex-col gap-3 px-3 py-1.5">
          {VEIL_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-text">
              <input
                type="radio"
                name={`veil-${message.messageId}`}
                checked={veil.visibility === option.value}
                onChange={() => setVeil((current) => ({ ...current, visibility: option.value }))}
              />
              {option.label}
            </label>
          ))}
          {needsAudience ? (
            <div className="flex flex-col gap-2">
              {members.length === 0 ? (
                <p className="text-sm text-text-muted">没有可选成员</p>
              ) : null}
              {members.map((member) =>
                member.userId ? (
                  <label key={member.userId} className="flex items-center gap-2 text-sm text-text">
                    <input
                      type="checkbox"
                      checked={veil.visibleTo.includes(member.userId)}
                      onChange={() =>
                        setVeil((current) => ({
                          ...current,
                          visibleTo: current.visibleTo.includes(member.userId ?? '')
                            ? current.visibleTo.filter((id) => id !== member.userId)
                            : [...current.visibleTo, member.userId ?? ''],
                        }))
                      }
                    />
                    {member.displayName || member.userId}
                  </label>
                ) : null,
              )}
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={veil.revealOnSpaceClose}
              onChange={() =>
                setVeil((current) => ({
                  ...current,
                  revealOnSpaceClose: !current.revealOnSpaceClose,
                }))
              }
            />
            结团后公开
          </label>
          <button
            type="button"
            disabled={needsAudience && veil.visibleTo.length === 0}
            className="rounded-control bg-accent px-4 py-2 text-sm font-semibold text-accent-text disabled:opacity-50"
            onClick={() => {
              onVeil(veil);
              setPanel(false);
            }}
          >
            保存
          </button>
        </div>
      ) : null}
    </div>
  );

  const panel = open ? (
    narrow ? (
      <div className="fixed inset-0 z-40 flex items-end bg-app-bg/40">
        <div
          ref={panelRef}
          className="max-h-[70dvh] w-full overflow-hidden rounded-overlay border border-border-subtle bg-surface"
        >
          {body}
        </div>
      </div>
    ) : (
      <div
        ref={panelRef}
        className="fixed z-40 w-64 overflow-hidden rounded-overlay border border-border-subtle bg-surface"
        style={box ?? undefined}
      >
        {body}
      </div>
    )
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="rounded-control px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-muted hover:text-text"
        aria-expanded={open}
        onClick={() => {
          if (open) setPanel(false);
          else {
            setVeil({
              visibility: message.veil?.visibility ?? 'all',
              visibleTo: [...(message.veil?.visibleTo ?? [])],
              revealOnSpaceClose: Boolean(message.veil?.revealOnSpaceClose),
            });
            setConfirming(false);
            setView('actions');
            place();
            setPanel(true);
          }
        }}
      >
        更多
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </>
  );
}

function PanelButton({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-control px-3 py-1.5 text-left text-sm hover:bg-surface-muted',
        danger ? 'text-danger' : 'text-text',
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function PreviousBody({ raw, spaceId, index }: { raw: unknown; spaceId: string; index: number }) {
  const body = readPreviousRaw(raw);
  if (body.kind === 'blocks') {
    return <BlockList blocks={body.blocks} messageId={`history-${index}`} spaceId={spaceId} />;
  }
  if (body.kind === 'clue') return <ClueCardView clue={body.clue} spaceId={spaceId} />;
  if (body.kind === 'text' && body.text) {
    return <p className="whitespace-pre-wrap text-base text-text">{body.text}</p>;
  }
  return <p className="text-sm text-text-muted">没有可显示的旧内容</p>;
}
