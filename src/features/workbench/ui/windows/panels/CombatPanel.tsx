import { useState } from 'react';

export function CombatPanel() {
  const [name, setName] = useState('');
  const [init, setInit] = useState('10');
  const [rows, setRows] = useState<{ id: string; name: string; init: number }[]>([]);
  const ordered = rows
    .slice()
    .sort((left, right) => right.init - left.init || left.name.localeCompare(right.name, 'zh'));

  return (
    <form
      className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        const value = Number(init);
        if (!trimmed || Number.isNaN(value)) return;
        setRows((current) => [...current, { id: `${Date.now()}`, name: trimmed, init: value }]);
        setName('');
      }}
    >
      <p className="text-xs text-text-muted">
        先把这一轮的先攻记在这里。切换房间或刷新后这份名单会清空。
      </p>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label="战斗单位"
          placeholder="名字"
          className="min-w-0 flex-1 rounded-control border border-border bg-app-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
        <input
          value={init}
          onChange={(event) => setInit(event.target.value)}
          aria-label="先攻"
          inputMode="numeric"
          className="w-16 rounded-control border border-border bg-app-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        className="rounded-control bg-accent px-4 py-2 text-sm font-semibold text-accent-text"
      >
        加入先攻
      </button>
      <ol className="scroll-subtle-native-hidden flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {ordered.length === 0 ? <li className="text-sm text-text-muted">先攻列表是空的</li> : null}
        {ordered.map((row, index) => (
          <li key={row.id} className="flex items-center gap-3 rounded-control bg-app-bg px-3 py-2">
            <span className="w-5 text-xs text-text-muted">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
              {row.name}
            </span>
            <span className="text-sm font-semibold text-accent">{row.init}</span>
            <button
              type="button"
              className="text-xs text-text-muted"
              onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
            >
              移除
            </button>
          </li>
        ))}
      </ol>
    </form>
  );
}
