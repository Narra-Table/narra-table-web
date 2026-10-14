import type { Editor } from '@tiptap/core';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  THEME_COLORS,
  exportComposerDoc,
  isThemeColor,
  textNodesToDoc,
  type ComposerExport,
} from '../model/richText';
import type { TextRun } from '../model/types';
import { bindSubmitOnEnter, composerExtensions } from './schema';

export interface RichFieldHandle {
  submit: () => void;
}

const COLOR_LABEL: Record<(typeof THEME_COLORS)[number], string> = {
  accent: '强调',
  danger: '危险',
  warning: '警告',
  success: '成功',
  info: '信息',
};

const COLOR_DOT: Record<(typeof THEME_COLORS)[number], string> = {
  accent: 'bg-accent',
  danger: 'bg-danger',
  warning: 'bg-warning',
  success: 'bg-success',
  info: 'bg-info',
};

function selectionRange(editor: Editor): { from: number; to: number } | null {
  const { from, to } = editor.state.selection;
  if (from === to) return null;
  return { from, to };
}

export const RichField = forwardRef<
  RichFieldHandle,
  {
    disabled: boolean;
    placeholder: string;
    editing: { messageId: string; nodes: TextRun[] } | null;
    onDocument: (doc: ComposerExport) => void;
    onSubmit: (doc: ComposerExport) => void;
  }
>(function RichField({ disabled, placeholder, editing, onDocument, onSubmit }, ref) {
  const onDocumentRef = useRef(onDocument);
  onDocumentRef.current = onDocument;
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const selectionRef = useRef<{ from: number; to: number } | null>(null);
  const rubyFocus = useRef(false);
  const [ruby, setRuby] = useState('');
  const [anchor, setAnchor] = useState<{ top: number; left: number; below: boolean } | null>(null);

  const editor = useEditor({
    extensions: composerExtensions,
    content: '',
    enableInputRules: false,
    enablePasteRules: false,
    editorProps: {
      attributes: {
        class:
          'min-h-16 w-full rounded-control border border-border bg-surface-muted px-4 py-2 text-base text-text outline-none',
        'aria-label': '发言',
      },
    },
    onUpdate: ({ editor: current }) => {
      onDocumentRef.current(exportComposerDoc(current.getJSON()));
    },
  });

  const snapshot = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      if (!current) return null;
      const range = selectionRange(current);
      return {
        empty: current.isEmpty,
        selected: Boolean(range),
        from: range?.from ?? 0,
        to: range?.to ?? 0,
        bold: current.isActive('bold'),
        italic: current.isActive('italic'),
        underline: current.isActive('underline'),
        strike: current.isActive('strike'),
        color: String(current.getAttributes('textColor').color ?? ''),
        ruby: String(current.getAttributes('ruby').ruby ?? ''),
      };
    },
  });

  const submitRef = useRef(() => {});
  submitRef.current = () => {
    if (!editor || disabled) return;
    const exported = exportComposerDoc(editor.getJSON());
    if (!exported.plain) return;
    onSubmitRef.current(exported);
    if (!editingRef.current) editor.commands.clearContent();
  };

  useImperativeHandle(ref, () => ({ submit: () => submitRef.current() }), []);

  useEffect(() => {
    bindSubmitOnEnter(() => {
      submitRef.current();
      return true;
    });
    return () => bindSubmitOnEnter(null);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    const current = editingRef.current;
    if (current?.messageId) {
      editor.commands.setContent(textNodesToDoc(current.nodes));
      editor.commands.focus('end');
    } else {
      editor.commands.clearContent();
    }
    onDocumentRef.current(exportComposerDoc(editor.getJSON()));
  }, [editor, editing?.messageId]);

  useEffect(() => {
    if (!rubyFocus.current) setRuby(snapshot?.ruby ?? '');
  }, [snapshot?.ruby]);

  useLayoutEffect(() => {
    if (!editor || disabled || !snapshot?.selected) {
      setAnchor(null);
      return;
    }
    const place = () => {
      const range = selectionRange(editor);
      if (!range) {
        setAnchor(null);
        return;
      }
      const start = editor.view.coordsAtPos(range.from);
      const end = editor.view.coordsAtPos(range.to);
      const top = Math.min(start.top, end.top);
      setAnchor({
        top,
        left: (start.left + end.left) / 2,
        below: top < 88,
      });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [disabled, editor, snapshot?.from, snapshot?.selected, snapshot?.to]);

  function remember() {
    if (!editor) return;
    const range = selectionRange(editor);
    if (range) selectionRef.current = range;
  }

  function restore() {
    const range = selectionRef.current;
    if (!editor || !range) return null;
    return editor.chain().focus().setTextSelection(range);
  }

  function toggle(name: 'bold' | 'italic' | 'underline' | 'strike') {
    const chain = restore();
    if (!chain) return;
    if (name === 'bold') chain.toggleBold().run();
    if (name === 'italic') chain.toggleItalic().run();
    if (name === 'underline') chain.toggleUnderline().run();
    if (name === 'strike') chain.toggleStrike().run();
  }

  function applyColor(color: string) {
    const chain = restore();
    if (!chain || !editor) return;
    const current = String(editor.getAttributes('textColor').color ?? '');
    if (current === color) chain.unsetMark('textColor').run();
    else chain.setMark('textColor', { color }).run();
  }

  function applyRuby(value: string) {
    const chain = restore();
    if (!chain) return;
    const next = value.trim();
    if (next) chain.setMark('ruby', { ruby: next }).run();
    else chain.unsetMark('ruby').run();
  }

  const bubble =
    anchor && snapshot?.selected
      ? createPortal(
          <div
            className="fixed z-40 flex w-72 flex-col gap-2 rounded-overlay border border-border-subtle bg-surface p-2"
            style={{
              top: anchor.below ? anchor.top + 28 : anchor.top - 8,
              left: anchor.left,
              transform: anchor.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            }}
            onMouseDown={(event) => {
              remember();
              const target = event.target;
              if (target instanceof HTMLElement && target.closest('input')) return;
              event.preventDefault();
            }}
          >
            <div className="flex flex-wrap gap-1">
              <StyleButton label="加粗" active={snapshot.bold} onClick={() => toggle('bold')} />
              <StyleButton label="斜体" active={snapshot.italic} onClick={() => toggle('italic')} />
              <StyleButton
                label="下划线"
                active={snapshot.underline}
                onClick={() => toggle('underline')}
              />
              <StyleButton
                label="删除线"
                active={snapshot.strike}
                onClick={() => toggle('strike')}
              />
            </div>
            <div className="flex items-center gap-2">
              {THEME_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={COLOR_LABEL[color]}
                  aria-pressed={snapshot.color === color}
                  className={cn(
                    'size-5 rounded-full',
                    COLOR_DOT[color],
                    snapshot.color === color && 'ring-2 ring-border',
                  )}
                  onClick={() => applyColor(color)}
                />
              ))}
              <input
                type="color"
                aria-label="自定义颜色"
                value={isThemeColor(snapshot.color) || !snapshot.color ? '#9a3412' : snapshot.color}
                onChange={(event) => applyColor(event.target.value.toLowerCase())}
                className="size-6 rounded-control border border-border bg-surface"
              />
            </div>
            <input
              aria-label="注音"
              value={ruby}
              placeholder="注音"
              onFocus={() => {
                rubyFocus.current = true;
                remember();
              }}
              onBlur={() => {
                rubyFocus.current = false;
              }}
              onChange={(event) => {
                setRuby(event.target.value);
                applyRuby(event.target.value);
              }}
              className="rounded-control border border-border bg-surface-muted px-3 py-1.5 text-sm text-text"
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={cn('relative min-h-16 flex-1', disabled && 'opacity-50')}>
      {snapshot?.empty ? (
        <p className="pointer-events-none absolute left-4 top-2 text-base text-text-muted">
          {placeholder}
        </p>
      ) : null}
      <EditorContent editor={editor} />
      {bubble}
    </div>
  );
});

function StyleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'rounded-control px-3 py-1.5 text-sm text-text',
        active ? 'bg-surface-muted font-semibold' : 'hover:bg-surface-muted',
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
