import { useRef, useState } from 'react';
import type { GithubComNarraTableBackendPkgProtocolMask } from '@/api/model/githubComNarraTableBackendPkgProtocolMask';
import { RichField, type RichFieldHandle } from './composer/RichField';
import type { ComposerExport } from './model/richText';
import type { OutgoingVeil, StagedReply, TextRun } from './model/types';

interface ComposerProps {
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
  const disabled = !canSend || loading;
  const placeholder = loading
    ? '正在进入房间'
    : editing
      ? '改完这一段'
      : canSend
        ? '写下来，以 . 开头则是指令'
        : '观察者无法发言';

  function submit(next: ComposerExport) {
    if (!next.plain || disabled || !maskId) return;
    if (editing) onSave(next);
    else onSubmit(next);
  }

  return (
    <div className="border-t border-border-subtle bg-surface px-4 py-4">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
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
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-text-muted" htmlFor="room-mask">
            面具
          </label>
          <select
            id="room-mask"
            value={maskId}
            disabled={disabled || Boolean(editing) || masks.length === 0}
            onChange={(event) => onMaskId(event.target.value)}
            className="rounded-control border border-border bg-surface-muted px-3 py-1.5 text-sm text-text"
          >
            {masks.length === 0 ? <option value="">没有可用面具</option> : null}
            {masks.map((mask) => (
              <option key={mask.maskId} value={mask.maskId}>
                {mask.name}
              </option>
            ))}
          </select>
          {canUseGmVeil && !editing ? (
            <button
              type="button"
              className="rounded-control border border-border px-3 py-1.5 text-sm text-text"
              onClick={() => onVeil(veil === 'all' ? 'gm_only' : 'all')}
            >
              {veil === 'all' ? '全员可见' : '仅 GM'}
            </button>
          ) : null}
        </div>
        <div className="flex items-end gap-3">
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
