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
}: {
  kind: WindowKind;
  spaceId: string;
  activeRoomId?: string;
}) {
  switch (kind) {
    case 'chat':
      return <ChatWindow spaceId={spaceId} roomId={activeRoomId} />;
    case 'characters':
      return <CharactersWindow spaceId={spaceId} />;
    case 'members':
      return <MembersWindow spaceId={spaceId} />;
    case 'clues':
      return <CluesWindow spaceId={spaceId} />;
    case 'combat':
      return <CombatWindow spaceId={spaceId} />;
    case 'map':
      return <MapWindow spaceId={spaceId} roomId={activeRoomId} />;
  }
}
