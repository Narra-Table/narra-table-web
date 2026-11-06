import { useLocation } from '@tanstack/react-router';
import {
  ArrowLeft,
  Bell,
  Bolt,
  MessageSquare,
  PanelsTopLeft,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
  Users,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CompositionEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useAppToolbarContext } from '../hooks/useAppToolbar';
import {
  resolveAppToolbarMode,
  type AppToolbarChatContent,
  type AppToolbarDefinition,
  type AppToolbarIcon,
  type AppToolbarMode,
  type AppToolbarPlacement,
} from '../model/toolbar';

function ToolButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid size-10 shrink-0 place-items-center text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
    >
      {children}
    </button>
  );
}

function useComposingTextInput(value: string, onChange: (value: string) => void) {
  const [draft, setDraft] = useState(value);
  const composingRef = useRef(false);
  const committedRef = useRef(value);

  useEffect(() => {
    if (composingRef.current) return;
    committedRef.current = value;
    setDraft(value);
  }, [value]);

  const commit = (next: string) => {
    if (committedRef.current === next) return;
    committedRef.current = next;
    onChange(next);
  };

  return {
    value: draft,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setDraft(next);
      if (!composingRef.current) commit(next);
    },
    onCompositionStart: () => {
      composingRef.current = true;
    },
    onCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => {
      composingRef.current = false;
      const next = event.currentTarget.value;
      setDraft(next);
      commit(next);
    },
  };
}

function SearchField({
  label,
  placeholder,
  value,
  onChange,
  inputRef,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const input = useComposingTextInput(value, onChange);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 px-3 transition-colors focus-within:bg-surface-muted">
      <Search className="icon-stroke size-5 shrink-0 text-text-muted" aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        role="searchbox"
        aria-label={label}
        placeholder={placeholder}
        {...input}
        className="min-w-0 flex-1 bg-transparent py-2 text-base text-text outline-none placeholder:text-text-muted"
      />
      {input.value ? (
        <button
          type="button"
          aria-label={`清空${label}`}
          title="清空"
          className="grid size-8 shrink-0 place-items-center text-text-muted transition-colors hover:bg-surface hover:text-text"
          onClick={() => onChange('')}
        >
          <X className="icon-stroke size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function HomeTools() {
  const [query, setQuery] = useState('');

  return (
    <>
      <SearchField label="全局搜索" placeholder="搜索" value={query} onChange={setQuery} />
      <ToolButton label="提醒">
        <Bell className="icon-stroke size-5" aria-hidden="true" />
      </ToolButton>
      <ToolButton label="快捷方式">
        <Bolt className="icon-stroke size-5" aria-hidden="true" />
      </ToolButton>
    </>
  );
}

function ChatTools() {
  return (
    <>
      <ToolButton label="添加附件">
        <Paperclip className="icon-stroke size-5" aria-hidden="true" />
      </ToolButton>
      <input
        aria-label="聊天输入"
        placeholder="输入消息"
        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base text-text outline-none placeholder:text-text-muted focus:bg-surface-muted"
      />
      <ToolButton label="选择表情">
        <Smile className="icon-stroke size-5" aria-hidden="true" />
      </ToolButton>
      <ToolButton label="发送消息">
        <Send className="icon-stroke size-5" aria-hidden="true" />
      </ToolButton>
    </>
  );
}

function ToolbarIcon({ icon }: { icon: AppToolbarIcon }) {
  const className = 'icon-stroke size-5';
  switch (icon) {
    case 'back':
      return <ArrowLeft className={className} aria-hidden="true" />;
    case 'chat':
      return <MessageSquare className={className} aria-hidden="true" />;
    case 'characters':
      return <Users className={className} aria-hidden="true" />;
    case 'windows':
      return <PanelsTopLeft className={className} aria-hidden="true" />;
  }
}

const contextualButtonClass =
  'grid size-10 shrink-0 place-items-center text-text-muted transition-colors hover:bg-surface-muted hover:text-text';

function ChatSwitcher({ content }: { content: AppToolbarChatContent }) {
  const [mode, setMode] = useState<'message' | 'search'>('message');
  const messageRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const messageInput = useComposingTextInput(content.message.value, content.message.onChange);

  useEffect(() => {
    if (mode === 'message') messageRef.current?.focus();
    if (mode === 'search') searchRef.current?.focus();
  }, [mode]);

  const panelClass =
    'absolute inset-0 flex min-w-0 items-stretch transition-all duration-300 ease-out motion-reduce:transition-none';

  return (
    <>
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div
          aria-hidden={mode !== 'message'}
          inert={mode !== 'message'}
          className={[
            panelClass,
            'items-center px-3 focus-within:bg-surface-muted',
            mode === 'message'
              ? 'translate-x-0 opacity-100'
              : 'pointer-events-none -translate-x-4 opacity-0',
          ].join(' ')}
        >
          <input
            ref={messageRef}
            type="text"
            aria-label={content.message.label}
            placeholder={content.message.placeholder}
            {...messageInput}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                content.message.onSubmit?.();
              }
            }}
            className="min-w-0 flex-1 bg-transparent py-2 text-base text-text outline-none placeholder:text-text-muted"
          />
        </div>
        <div
          aria-hidden={mode !== 'search'}
          inert={mode !== 'search'}
          className={[
            panelClass,
            mode === 'search'
              ? 'translate-x-0 opacity-100'
              : 'pointer-events-none translate-x-4 opacity-0',
          ].join(' ')}
        >
          <SearchField {...content.search} inputRef={searchRef} />
        </div>
      </div>
      <button
        type="button"
        aria-label="搜索聊天记录"
        title="搜索聊天记录"
        aria-pressed={mode === 'search'}
        className={[
          contextualButtonClass,
          mode === 'search' ? 'bg-surface-muted text-accent' : '',
        ].join(' ')}
        onClick={() => setMode('search')}
      >
        <Search className="icon-stroke size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="发送消息"
        title="发送消息"
        aria-pressed={mode === 'message'}
        className={[
          contextualButtonClass,
          mode === 'message' ? 'bg-surface-muted text-accent' : '',
        ].join(' ')}
        onClick={() => {
          if (mode !== 'message') setMode('message');
          else content.message.onSubmit?.();
        }}
      >
        <Send className="icon-stroke size-5" aria-hidden="true" />
      </button>
    </>
  );
}

export function AppToolbarControls({ definition }: { definition: AppToolbarDefinition }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const content = definition.content;

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const menu = definition.menu ? (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={definition.menu.label}
        title={definition.menu.label}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className={contextualButtonClass}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <Plus className="icon-stroke size-5" aria-hidden="true" />
      </button>
      {menuOpen ? (
        <div
          role="menu"
          aria-label={definition.menu.label}
          className="absolute right-0 bottom-full mb-3 w-36 border border-border bg-surface p-1 shadow-lg"
        >
          {definition.menu.items.map((item) => (
            <button
              type="button"
              role="menuitem"
              key={item.id}
              className={[
                'block w-full px-3 py-2 text-left text-sm hover:bg-surface-muted',
                item.active ? 'text-accent' : 'text-text',
              ].join(' ')}
              onClick={() => {
                item.onSelect();
                setMenuOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <>
      {definition.leadingAction ? (
        <button
          type="button"
          aria-label={definition.leadingAction.label}
          title={definition.leadingAction.label}
          className={contextualButtonClass}
          onClick={definition.leadingAction.onTrigger}
        >
          <ToolbarIcon icon={definition.leadingAction.icon} />
        </button>
      ) : null}
      {content?.kind === 'chat-switcher' ? (
        <ChatSwitcher content={content} />
      ) : content?.kind === 'search' ? (
        <SearchField
          label={content.label}
          placeholder={content.placeholder}
          value={content.value}
          onChange={content.onChange}
        />
      ) : null}
      {menu}
    </>
  );
}

export function AppToolbarSurface({
  mode,
  placement = 'floating',
  children,
}: {
  mode: AppToolbarMode;
  placement?: AppToolbarPlacement;
  children?: ReactNode;
}) {
  return (
    <footer
      aria-label="页面工具栏"
      className={
        mode === 'hidden'
          ? 'hidden'
          : [
              'pointer-events-none fixed inset-x-0 z-40 hidden justify-center transition-all duration-300 ease-out motion-reduce:transition-none lg:flex',
              placement === 'docked' ? 'bottom-0 px-0' : 'bottom-3 px-3',
            ].join(' ')
      }
    >
      <div
        className={[
          'pointer-events-auto w-full bg-surface transition-all duration-300 ease-out starting:translate-y-full starting:opacity-0 motion-reduce:transition-none',
          placement === 'docked'
            ? 'h-13 max-w-none border-t border-border-subtle p-1'
            : 'max-w-3xl border border-border-subtle p-1 shadow-lg',
        ].join(' ')}
      >
        <div className="mx-auto flex min-h-10 w-full max-w-3xl items-stretch divide-x divide-border-subtle">
          {children ?? (mode === 'chat' ? <ChatTools /> : <HomeTools />)}
        </div>
      </div>
    </footer>
  );
}

export function AppToolbar() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const { activeEntry } = useAppToolbarContext();
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHost(document.getElementById('toolbar-root'));
  }, []);

  if (!host) return null;
  const mode = resolveAppToolbarMode(pathname);
  return createPortal(
    <AppToolbarSurface
      key={activeEntry ? 'context-toolbar' : `default-${mode}`}
      mode={mode}
      placement={activeEntry?.definition.placement}
    >
      {activeEntry ? <AppToolbarControls definition={activeEntry.definition} /> : null}
    </AppToolbarSurface>,
    host,
  );
}
