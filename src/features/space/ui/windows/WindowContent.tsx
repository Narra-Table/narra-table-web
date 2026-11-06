import type { WindowKind } from '../../model/window';
import {
  CharactersWindow,
  ChatWindow,
  CluesWindow,
  CombatWindow,
  MapWindow,
  MembersWindow,
} from './MockWindows';

export function WindowContent({
  kind,
  spaceId,
  activeRoomId,
  query = '',
}: {
  kind: WindowKind;
  spaceId: string;
  activeRoomId?: string;
  query?: string;
}) {
  switch (kind) {
    case 'chat':
      return <ChatWindow spaceId={spaceId} roomId={activeRoomId} query={query} />;
    case 'characters':
      return <CharactersWindow spaceId={spaceId} query={query} />;
    case 'members':
      return <MembersWindow spaceId={spaceId} query={query} />;
    case 'clues':
      return <CluesWindow spaceId={spaceId} query={query} />;
    case 'combat':
      return <CombatWindow spaceId={spaceId} query={query} />;
    case 'map':
      return <MapWindow spaceId={spaceId} roomId={activeRoomId} />;
  }
}
