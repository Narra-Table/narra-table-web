import { createFileRoute } from '@tanstack/react-router';
import { RoomChat } from '@/features/room-chat/RoomChat';

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
  const { scene } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <RoomChat
      spaceId={spaceId}
      roomId={roomId}
      scene={scene}
      onSceneChange={(next) => {
        void navigate({
          search: (prev) => ({ ...prev, scene: next }),
          replace: true,
        });
      }}
    />
  );
}
