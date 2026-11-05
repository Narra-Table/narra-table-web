import type { WindowKind } from '../../model/window';
import {
  CharactersWindow,
  ChatWindow,
  CluesWindow,
  CombatWindow,
  MapWindow,
  MembersWindow,
} from './MockWindows';

export function WindowContent({ kind }: { kind: WindowKind }) {
  switch (kind) {
    case 'chat':
      return <ChatWindow />;
    case 'characters':
      return <CharactersWindow />;
    case 'members':
      return <MembersWindow />;
    case 'clues':
      return <CluesWindow />;
    case 'combat':
      return <CombatWindow />;
    case 'map':
      return <MapWindow />;
  }
}
