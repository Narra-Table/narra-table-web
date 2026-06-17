import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_table/tables/$tableId')({
  component: TableWorkspacePage,
  validateSearch: (search: Record<string, unknown>) => ({
    focus: typeof search.focus === 'string' ? search.focus : 'chat',
    panel: typeof search.panel === 'string' ? search.panel : 'chat',
    right: typeof search.right === 'string' ? search.right : 'characters',
    scene: typeof search.scene === 'string' ? search.scene : undefined,
  }),
});

function TableWorkspacePage() {
  return null;
}
