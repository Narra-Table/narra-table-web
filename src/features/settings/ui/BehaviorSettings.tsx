export function BehaviorSettings({
  edgeAutoScroll,
  onEdgeAutoScrollChange,
}: {
  edgeAutoScroll: boolean;
  onEdgeAutoScrollChange: (enabled: boolean) => void;
}) {
  return (
    <div className="grid gap-10">
      <section>
        <h2 className="text-xl font-semibold">窗口</h2>
        <div className="mt-5 flex max-w-xl items-center justify-between gap-6 border border-border-subtle bg-surface p-4">
          <div>
            <h3 className="text-base font-semibold text-text">边缘自动滚动</h3>
            <p className="mt-1 text-sm text-text-muted">
              鼠标停留在空间窗口区域左右边缘时，自动横向移动窗口区域
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="边缘自动滚动"
            aria-checked={edgeAutoScroll}
            onClick={() => onEdgeAutoScrollChange(!edgeAutoScroll)}
            className={[
              'relative h-6 w-11 shrink-0 cursor-pointer border transition-colors',
              edgeAutoScroll ? 'border-accent bg-accent' : 'border-border bg-surface-muted',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-1 left-0 size-4 bg-surface transition-transform',
                edgeAutoScroll ? 'translate-x-6' : 'translate-x-1',
              ].join(' ')}
            />
          </button>
        </div>
      </section>
    </div>
  );
}
