import type { Editor } from '@tiptap/core';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { exportComposerDoc, textNodesToDoc, type ComposerExport } from '../../model/richText';
import type { TextRun } from '../../model/types';
import { ColorMenu } from './ColorMenu';
import { createComposerExtensions } from './schema';

export interface RichFieldHandle {
  submit: () => void;
  insertText: (text: string) => void;
}

/** Destroyed editors null out `commandManager`; reading `.commands` throws. */
function liveEditor(editor: Editor | null): editor is Editor {
  return !!editor && !editor.isDestroyed;
}

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
  const submitRef = useRef<() => boolean>(() => false);
  const rubyFocus = useRef(false);
  const rubyComposing = useRef(false);
  const [ruby, setRuby] = useState('');
  const [anchor, setAnchor] = useState<{ top: number; left: number; below: boolean } | null>(null);
  const extensions = useMemo(() => createComposerExtensions(() => submitRef.current()), []);

  const editor = useEditor({
    extensions,
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
        background: String(current.getAttributes('textBackground').background ?? ''),
        ruby: String(current.getAttributes('ruby').ruby ?? ''),
      };
    },
  });

  submitRef.current = () => {
    if (!liveEditor(editor) || disabled) return false;
    const exported = exportComposerDoc(editor.getJSON());
    if (!exported.plain) return false;
    onSubmitRef.current(exported);
    if (!editingRef.current) editor.commands.clearContent();
    return true;
  };
  const editorRef = useRef(editor);
  editorRef.current = editor;

  useImperativeHandle(
    ref,
    () => ({
      submit: () => submitRef.current(),
      insertText: (text: string) => {
        const current = editorRef.current;
        if (!liveEditor(current) || !text) return;
        current.chain().focus().insertContent(text).run();
      },
    }),
    [],
  );

  useEffect(() => {
    if (!liveEditor(editor)) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!liveEditor(editor)) return;
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

  useEffect(() => {
    if (rubyFocus.current || !snapshot?.selected) return;
    selectionRef.current = { from: snapshot.from, to: snapshot.to };
  }, [snapshot?.from, snapshot?.selected, snapshot?.to]);

  useLayoutEffect(() => {
    if (!liveEditor(editor) || disabled || !snapshot?.selected) {
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
    if (!liveEditor(editor)) return;
    const range = selectionRange(editor);
    if (range) selectionRef.current = range;
  }

  function restore() {
    const range = selectionRef.current;
    if (!liveEditor(editor) || !range) return null;
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

  function paintMark(
    markName: 'textColor' | 'textBackground',
    attr: 'color' | 'background',
    next: string,
  ) {
    if (!liveEditor(editor)) return;
    const live = selectionRange(editor);
    if (live) selectionRef.current = live;
    const range = selectionRef.current;
    if (!range) return;
    editor.commands.command(({ tr, state }) => {
      const markType = state.schema.marks[markName];
      if (!markType) return false;
      const max = state.doc.content.size;
      const from = Math.min(range.from, range.to);
      const to = Math.max(range.from, range.to);
      if (from < 0 || to > max || from >= to) return false;
      if (next) tr.addMark(from, to, markType.create({ [attr]: next }));
      else tr.removeMark(from, to, markType);
      return true;
    });
  }

  function applyTheme(target: 'text' | 'background', value: string) {
    if (!liveEditor(editor)) return;
    if (target === 'text') {
      const current = String(editor.getAttributes('textColor').color ?? '');
      paintMark('textColor', 'color', current === value ? '' : value);
      return;
    }
    const current = String(editor.getAttributes('textBackground').background ?? '');
    paintMark('textBackground', 'background', current === value ? '' : value);
  }

  function paintCustom(target: 'text' | 'background', hex: string) {
    if (target === 'text') paintMark('textColor', 'color', hex);
    else paintMark('textBackground', 'background', hex);
  }

  function clearColor(target: 'text' | 'background') {
    if (target === 'text') paintMark('textColor', 'color', '');
    else paintMark('textBackground', 'background', '');
  }

  function resetColors() {
    clearColor('text');
    clearColor('background');
  }

  function commitRuby(value: string) {
    const range = selectionRef.current;
    if (!liveEditor(editor) || !range) return;
    editor.commands.command(({ tr, state }) => {
      const markType = state.schema.marks.ruby;
      if (!markType) return false;
      const max = state.doc.content.size;
      const from = Math.min(range.from, range.to);
      const to = Math.max(range.from, range.to);
      if (from < 0 || to > max || from >= to) return false;
      if (value) tr.addMark(from, to, markType.create({ ruby: value }));
      else tr.removeMark(from, to, markType);
      return true;
    });
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
            <ColorMenu
              color={snapshot.color}
              background={snapshot.background}
              onTheme={applyTheme}
              onCustom={paintCustom}
              onClear={clearColor}
              onReset={resetColors}
              onPrepare={remember}
            />
            <input
              aria-label="注音"
              value={ruby}
              placeholder="注音"
              autoComplete="off"
              spellCheck={false}
              onMouseDown={() => {
                rubyFocus.current = true;
                remember();
              }}
              onFocus={() => {
                rubyFocus.current = true;
                remember();
              }}
              onBlur={(event) => {
                rubyFocus.current = false;
                rubyComposing.current = false;
                const trimmed = event.currentTarget.value.trim();
                setRuby(trimmed);
                commitRuby(trimmed);
              }}
              onCompositionStart={() => {
                rubyComposing.current = true;
              }}
              onCompositionEnd={(event) => {
                rubyComposing.current = false;
                const value = event.currentTarget.value;
                if (!rubyFocus.current) {
                  const trimmed = value.trim();
                  setRuby(trimmed);
                  commitRuby(trimmed);
                  return;
                }
                setRuby(value);
                commitRuby(value);
              }}
              onChange={(event) => {
                const value = event.target.value;
                setRuby(value);
                const native = event.nativeEvent;
                if (rubyComposing.current || ('isComposing' in native && native.isComposing))
                  return;
                commitRuby(value);
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
