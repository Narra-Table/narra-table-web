import { Dice5, Smile } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { GithubComNarraTableBackendPkgProtocolMask } from '@/api/model/githubComNarraTableBackendPkgProtocolMask';
import { useResourceUrl } from '@/features/resources';
import type { ComposerExport } from '../../model/richText';
import type { OutgoingVeil, StagedReply, TextRun } from '../../model/types';
import { RichField, type RichFieldHandle } from './RichField';

const FACES = ['(´▽`)', '(；′⌒`)', 'Σ(°△°', '(￣▽￣)', '（＞人＜）', '(｀・ω・´)'];
const DICE = [
  { label: 'd100', text: '.r 1d100' },
  { label: 'd20', text: '.r 1d20' },
  { label: '2d6', text: '.r 2d6' },
];

interface ComposerProps {
  spaceId: string;
  masks: GithubComNarraTableBackendPkgProtocolMask[];
  maskId: string;
  onMaskId: (maskId: string) => void;
  veil: OutgoingVeil;
  onVeil: (veil: OutgoingVeil) => void;
  canSend: boolean;
  canUseGmVeil: boolean;
  loading: boolean;
  reply: StagedReply | null;
  onClearReply: () => void;
  editing: { messageId: string; nodes: TextRun[] } | null;
  onCancelEdit: () => void;
  onSubmit: (draft: ComposerExport) => void;
  onSave: (draft: ComposerExport) => void;
}

export function Composer({
  spaceId,
  masks,
  maskId,
  onMaskId,
  veil,
  onVeil,
  canSend,
  canUseGmVeil,
  loading,
  reply,
  onClearReply,
  editing,
  onCancelEdit,
  onSubmit,
  onSave,
}: ComposerProps) {
  const fieldRef = useRef<RichFieldHandle>(null);
  const [draft, setDraft] = useState<ComposerExport>({ plain: '', nodes: [], command: false });
  const [menu, setMenu] = useState<'mask' | 'face' | 'dice' | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const disabled = !canSend || loading;
  const mask = masks.find((item) => item.maskId === maskId);
  const placeholder = loading
    ? '正在进入房间'
    : editing
      ? '改完这一段'
      : canSend
        ? '写下来，以 . 开头则是指令'
        : '观察者无法发言';

  useEffect(() => {
    if (!menu) return;
    function onPointerDown(event: PointerEvent) {
      if (barRef.current?.contains(event.target as Node)) return;
      setMenu(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenu(null);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menu]);

  function submit(next: ComposerExport) {
    if (!next.plain || disabled || !maskId) return;
    if (editing) onSave(next);
    else onSubmit(next);
  }

  function insert(text: string) {
    fieldRef.current?.insertText(text);
    setMenu(null);
  }

  return (
    <div className="shrink-0 border-t border-border-subtle bg-surface px-3 pt-1.5 pb-3">
      <div ref={barRef} className="mx-auto flex w-full max-w-2xl flex-col gap-2">
        {editing ? (
          <div className="flex items-center justify-between gap-3 rounded-control bg-surface-muted px-4 py-2">
            <p className="text-sm font-medium text-text">正在编辑发言</p>
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-text-muted"
              onClick={onCancelEdit}
            >
              取消
            </button>
          </div>
        ) : null}
        {reply && !editing ? (
          <div className="flex items-start justify-between gap-3 rounded-control bg-surface-muted px-4 py-2">
            <p className="min-w-0 text-sm text-text-muted">
              <span className="font-medium text-text">{reply.preview.senderName || '回复'}</span>
              <span className="ml-2">{reply.preview.textSnippet}</span>
            </p>
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-text-muted"
              onClick={onClearReply}
            >
              取消
            </button>
          </div>
        ) : null}
        <div className="flex items-center gap-2 border-b border-border-subtle pb-1.5">
          <div className="relative">
            <button
              type="button"
              aria-label="切换面具"
              aria-expanded={menu === 'mask'}
              disabled={disabled || Boolean(editing) || masks.length === 0}
              onClick={() => setMenu((current) => (current === 'mask' ? null : 'mask'))}
              className="grid size-7 place-items-center overflow-hidden rounded-full bg-surface-muted text-xs font-semibold text-text disabled:opacity-50"
            >
              <MaskFace spaceId={spaceId} mask={mask} />
            </button>
            {menu === 'mask' ? (
              <div className="absolute bottom-full left-0 z-30 mb-2 max-h-64 w-52 overflow-y-auto rounded-overlay border border-border-subtle bg-surface p-1">
                {masks.map((item) => (
                  <button
                    key={item.maskId}
                    type="button"
                    onClick={() => {
                      onMaskId(item.maskId);
                      setMenu(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
                  >
                    <span className="grid size-6 place-items-center overflow-hidden rounded-full bg-surface-muted text-xs">
                      <MaskFace spaceId={spaceId} mask={item} />
                    </span>
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <p className="min-w-0 truncate text-sm font-medium text-text">
            {mask?.name ?? '没有可用面具'}
          </p>
          <div className="relative flex items-center gap-1">
            <IconButton
              label="表情"
              pressed={menu === 'face'}
              disabled={disabled}
              onClick={() => setMenu((current) => (current === 'face' ? null : 'face'))}
            >
              <Smile className="icon-stroke size-5" />
            </IconButton>
            <IconButton
              label="骰点"
              pressed={menu === 'dice'}
              disabled={disabled || Boolean(editing)}
              onClick={() => setMenu((current) => (current === 'dice' ? null : 'dice'))}
            >
              <Dice5 className="icon-stroke size-5" />
            </IconButton>
            {menu === 'face' ? (
              <div className="absolute bottom-full left-0 z-30 mb-2 grid w-56 grid-cols-2 gap-1 rounded-overlay border border-border-subtle bg-surface p-2">
                {FACES.map((face) => (
                  <button
                    key={face}
                    type="button"
                    className="rounded-control px-2 py-1.5 text-xs text-text hover:bg-surface-muted"
                    onClick={() => insert(face)}
                  >
                    {face}
                  </button>
                ))}
              </div>
            ) : null}
            {menu === 'dice' ? (
              <div className="absolute bottom-full left-8 z-30 mb-2 flex w-28 flex-col rounded-overlay border border-border-subtle bg-surface p-1">
                {DICE.map((item) => (
                  <button
                    key={item.text}
                    type="button"
                    className="rounded-control px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
                    onClick={() => insert(item.text)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {canUseGmVeil && !editing ? (
            <button
              type="button"
              className="ml-auto shrink-0 rounded-control border border-border px-3 py-1.5 text-sm text-text"
              onClick={() => onVeil(veil === 'all' ? 'gm_only' : 'all')}
            >
              {veil === 'all' ? '全员可见' : '仅 GM'}
            </button>
          ) : null}
        </div>
        <div className="flex items-end gap-2">
          <RichField
            ref={fieldRef}
            disabled={disabled}
            placeholder={placeholder}
            editing={editing}
            onDocument={setDraft}
            onSubmit={submit}
          />
          <button
            type="button"
            disabled={disabled || !draft.plain || !maskId}
            onClick={() => fieldRef.current?.submit()}
            className="rounded-control bg-accent px-5 py-2.5 text-sm font-semibold text-accent-text disabled:opacity-50"
          >
            {editing ? '保存' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  label,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string;
  pressed: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-control text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function MaskFace({
  spaceId,
  mask,
}: {
  spaceId: string;
  mask?: GithubComNarraTableBackendPkgProtocolMask;
}) {
  const resourceId = mask?.currentAvatarId ? mask.avatars?.[mask.currentAvatarId] : undefined;
  const media = useResourceUrl(spaceId, resourceId);
  if (media.url) return <img src={media.url} alt="" className="size-full object-cover" />;
  return mask?.name.slice(0, 1) ?? '面';
}
