import { useState, type FormEvent } from 'react';
import { cn } from '@/lib/classNames';

const inputClass =
  'min-w-0 flex-1 rounded-control border border-border bg-app-bg px-3 py-2 text-sm text-text outline-none focus:border-accent';
const buttonClass =
  'shrink-0 rounded-control bg-accent px-3 py-2 text-sm font-semibold text-accent-text';

function Empty() {
  return <p className="py-4 text-center text-sm text-text-muted">—</p>;
}

export function ChatWindow() {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  function send(event: FormEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    setMessages((current) => [...current, value]);
    setDraft('');
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      {messages.length === 0 ? <Empty /> : null}
      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {messages.map((message, index) => (
          <li key={`${message}-${index}`} className="rounded-control bg-app-bg px-3 py-2 text-sm">
            {message}
          </li>
        ))}
      </ul>
      <form className="flex gap-2" onSubmit={send}>
        <input
          aria-label="消息"
          placeholder="消息"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className={inputClass}
        />
        <button type="submit" className={buttonClass}>
          发送
        </button>
      </form>
    </div>
  );
}

export function CharactersWindow() {
  const [name, setName] = useState('');
  const [characters, setCharacters] = useState(['调查员']);

  function add(event: FormEvent) {
    event.preventDefault();
    const value = name.trim();
    if (!value) return;
    setCharacters((current) => [...current, value]);
    setName('');
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <form className="flex gap-2" onSubmit={add}>
        <input
          aria-label="角色名"
          placeholder="角色名"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
        />
        <button type="submit" className={buttonClass}>
          添加
        </button>
      </form>
      {characters.length === 0 ? <Empty /> : null}
      <ul className="flex flex-col gap-1 overflow-y-auto">
        {characters.map((character, index) => (
          <li key={`${character}-${index}`} className="flex items-center gap-2 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm text-text">{character}</span>
            <button
              type="button"
              className="text-xs text-text-muted hover:text-danger"
              onClick={() =>
                setCharacters((current) => current.filter((_, item) => item !== index))
              }
            >
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MembersWindow() {
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const members = ['主持人', '玩家一', '玩家二'];

  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
      {members.map((member) => (
        <li key={member} className="flex items-center gap-2 px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-sm text-text">{member}</span>
          <button
            type="button"
            className={cn('text-xs', ready[member] ? 'text-success' : 'text-text-muted')}
            onClick={() => setReady((current) => ({ ...current, [member]: !current[member] }))}
          >
            {ready[member] ? '已就绪' : '未就绪'}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function CluesWindow() {
  const [title, setTitle] = useState('');
  const [clues, setClues] = useState<string[]>([]);

  function add(event: FormEvent) {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;
    setClues((current) => [...current, value]);
    setTitle('');
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <form className="flex gap-2" onSubmit={add}>
        <input
          aria-label="线索"
          placeholder="线索"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={inputClass}
        />
        <button type="submit" className={buttonClass}>
          添加
        </button>
      </form>
      {clues.length === 0 ? <Empty /> : null}
      <ul className="flex flex-col gap-1 overflow-y-auto">
        {clues.map((clue, index) => (
          <li key={`${clue}-${index}`} className="flex items-center gap-2 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm text-text">{clue}</span>
            <button
              type="button"
              className="text-xs text-text-muted hover:text-danger"
              onClick={() => setClues((current) => current.filter((_, item) => item !== index))}
            >
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CombatWindow() {
  const [name, setName] = useState('');
  const [rows, setRows] = useState<string[]>([]);

  function add(event: FormEvent) {
    event.preventDefault();
    const value = name.trim();
    if (!value) return;
    setRows((current) => [...current, value]);
    setName('');
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <form className="flex gap-2" onSubmit={add}>
        <input
          aria-label="战斗单位"
          placeholder="战斗单位"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
        />
        <button type="submit" className={buttonClass}>
          添加
        </button>
      </form>
      {rows.length === 0 ? <Empty /> : null}
      <ol className="flex flex-col gap-1 overflow-y-auto">
        {rows.map((row, index) => (
          <li key={`${row}-${index}`} className="flex items-center gap-3 px-3 py-2">
            <span className="w-5 text-xs text-text-muted">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-text">{row}</span>
            <button
              type="button"
              className="text-xs text-text-muted hover:text-danger"
              onClick={() => setRows((current) => current.filter((_, item) => item !== index))}
            >
              删除
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function MapWindow() {
  const [pins, setPins] = useState<Set<number>>(() => new Set());

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <button
        type="button"
        className="self-end text-xs text-text-muted hover:text-text"
        onClick={() => setPins(new Set())}
      >
        清空
      </button>
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-1">
        {Array.from({ length: 16 }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`格子 ${index + 1}`}
            className={cn(
              'min-h-12 rounded-control border border-border-subtle text-sm',
              pins.has(index) ? 'bg-accent text-accent-text' : 'bg-app-bg text-text-muted',
            )}
            onClick={() =>
              setPins((current) => {
                const next = new Set(current);
                if (next.has(index)) next.delete(index);
                else next.add(index);
                return next;
              })
            }
          >
            {pins.has(index) ? '•' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
