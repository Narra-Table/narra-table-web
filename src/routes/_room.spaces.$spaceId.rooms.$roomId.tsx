import { createFileRoute } from '@tanstack/react-router';
import { RoomWorkspace } from '@/features/room/RoomWorkspace';

export const Route = createFileRoute('/_room/spaces/$spaceId/rooms/$roomId')({
  component: RoomWorkspacePage,
  validateSearch: (search: Record<string, unknown>) => ({
    focus: typeof search.focus === 'string' ? search.focus : 'chat',
    panel: typeof search.panel === 'string' ? search.panel : 'chat',
    right: typeof search.right === 'string' ? search.right : 'characters',
    scene: typeof search.scene === 'string' ? search.scene : undefined,
  }),
});

function RoomWorkspacePage() {
  const { spaceId, roomId } = Route.useParams();
  return <RoomWorkspace roomId={roomId} spaceId={spaceId} />;
}
