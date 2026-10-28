import { useWorkbenchContext } from './context';

export function EmptyWorkspace() {
  const { messages } = useWorkbenchContext();
  return (
    <div className="wm-empty">
      <strong>{messages.emptyTitle}</strong>
      <p>{messages.emptyBody}</p>
    </div>
  );
}
