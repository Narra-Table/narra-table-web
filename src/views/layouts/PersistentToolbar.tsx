import { useLocation } from '@tanstack/react-router';
import { Bell, Bolt, Paperclip, Search, Send, Smile, Sparkles } from 'lucide-react';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { createPortal } from 'react-dom';

export type PersistentToolbarMode = 'home' | 'chat' | 'hidden';
export type PersistentToolbarPlacement = 'floating' | 'docked';

interface ToolbarOverride {
  id: symbol;
  content: ReactNode;
  placement: PersistentToolbarPlacement;
}

interface PersistentToolbarContextValue {
  override: ToolbarOverride | null;
  setOverride: Dispatch<SetStateAction<ToolbarOverride | null>>;
}

const PersistentToolbarContext = createContext<PersistentToolbarContextValue | null>(null);

export function PersistentToolbarProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<ToolbarOverride | null>(null);
  return (
    <PersistentToolbarContext value={{ override, setOverride }}>
      {children}
    </PersistentToolbarContext>
  );
}

export function usePersistentToolbar(
  content: ReactNode,
  placement: PersistentToolbarPlacement = 'floating',
): void {
  const context = useContext(PersistentToolbarContext);
  if (!context)
    throw new Error('usePersistentToolbar must be used inside PersistentToolbarProvider');
  const { setOverride } = context;

  useEffect(() => {
    const id = Symbol('persistent-toolbar');
    setOverride({ id, content, placement });
    return () => {
      setOverride((current) => (current?.id === id ? null : current));
    };
  }, [content, placement, setOverride]);
}

export function resolvePersistentToolbarMode(pathname: string): PersistentToolbarMode {
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  ) {
    return 'hidden';
  }
  if (pathname === '/message' || pathname.startsWith('/spaces/')) return 'chat';
  return 'home';
}

function ToolButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid size-10 shrink-0 place-items-center bg-surface text-text-muted transition-colors hover:text-text"
    >
      {children}
    </button>
  );
}

function HomeTools() {
  return (
    <>
      <label className="flex min-w-0 flex-1 items-center gap-2 bg-surface px-3">
        <Search className="icon-stroke size-5 shrink-0 text-text-muted" aria-hidden="true" />
        <input
          type="search"
          aria-label="全局搜索"
          placeholder="搜索"
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-text outline-none placeholder:text-text-muted"
        />
      </label>
      <ToolButton label="提醒">
        <Bell className="icon-stroke size-5" aria-hidden="true" />
      </ToolButton>
      <ToolButton label="快捷方式">
        <Bolt className="icon-stroke size-5" aria-hidden="true" />
      </ToolButton>
      <ToolButton label="快速创建">
        <Sparkles className="icon-stroke size-5" aria-hidden="true" />
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
        className="min-w-0 flex-1 bg-surface px-3 py-2 text-base text-text outline-none placeholder:text-text-muted"
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

export function PersistentToolbarSurface({
  mode,
  placement = 'floating',
  children,
}: {
  mode: PersistentToolbarMode;
  placement?: PersistentToolbarPlacement;
  children?: ReactNode;
}) {
  return (
    <footer
      aria-label="页面工具栏"
      className={
        mode === 'hidden'
          ? 'hidden'
          : [
              'pointer-events-none fixed inset-x-0 z-40 flex justify-center transition-all duration-300 ease-out motion-reduce:transition-none',
              placement === 'docked'
                ? 'bottom-0 px-0'
                : mode === 'home'
                  ? 'bottom-18 px-3 lg:bottom-3'
                  : 'bottom-3 px-3',
            ].join(' ')
      }
    >
      <div
        className={[
          'pointer-events-auto w-full bg-surface-muted p-2 shadow-lg transition-all duration-300 ease-out starting:translate-y-full starting:opacity-0 motion-reduce:transition-none',
          placement === 'docked' ? 'min-h-15 max-w-none' : 'max-w-3xl',
        ].join(' ')}
      >
        <div className="mx-auto flex min-h-10 w-full max-w-3xl items-stretch gap-2">
          {children ?? (mode === 'chat' ? <ChatTools /> : <HomeTools />)}
        </div>
      </div>
    </footer>
  );
}

export function PersistentToolbar() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const context = useContext(PersistentToolbarContext);
  const [host, setHost] = useState<HTMLElement | null>(null);

  if (!context) throw new Error('PersistentToolbar must be used inside PersistentToolbarProvider');

  useEffect(() => {
    setHost(document.getElementById('toolbar-root'));
  }, []);

  if (!host) return null;
  const mode = resolvePersistentToolbarMode(pathname);
  return createPortal(
    <PersistentToolbarSurface
      key={context.override ? 'page-toolbar' : `default-${mode}`}
      mode={mode}
      placement={context.override?.placement}
    >
      {context.override?.content}
    </PersistentToolbarSurface>,
    host,
  );
}
