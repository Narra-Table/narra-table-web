import type { GithubComNarraTableBackendPkgProtocolRoom } from '@/api/model/githubComNarraTableBackendPkgProtocolRoom';
import { RoomChat } from '@/features/room-chat';
import { CharactersPanel, CluesPanel, CombatPanel, MapPanel, MembersPanel } from './panels';
import type { WindowKind } from './windows';

export interface WindowSeekRequest {
  roomId: string;
  query: string;
}

function WindowEmpty({ text }: { text: string }) {
  return (
    <div className="grid min-h-0 flex-1 place-items-center px-4">
      <p className="text-sm text-text-muted">{text}</p>
    </div>
  );
}

/** 工作台只负责窗口外壳，每个窗口的内容和上下文在这里接起来。 */
export function WindowContent({
  kind,
  spaceId,
  roomId,
  rooms,
  scene,
  query,
  onRoomChange,
  onQueryChange,
  onSceneChange,
  onSeek,
}: {
  kind: WindowKind;
  spaceId: string;
  roomId: string;
  rooms: GithubComNarraTableBackendPkgProtocolRoom[];
  scene?: string;
  query: string;
  onRoomChange: (roomId: string) => void;
  onQueryChange: (value: string) => void;
  onSceneChange: (sceneId: string) => void;
  onSeek: (request: WindowSeekRequest) => void;
}) {
  switch (kind) {
    case 'chat':
      return roomId ? (
        <RoomChat
          key={roomId}
          spaceId={spaceId}
          roomId={roomId}
          rooms={rooms}
          scene={scene}
          query={query}
          onRoomChange={onRoomChange}
          onQueryChange={onQueryChange}
          onSceneChange={onSceneChange}
        />
      ) : (
        <WindowEmpty text="这个空间还没有房间" />
      );
    case 'characters':
      return <CharactersPanel spaceId={spaceId} />;
    case 'members':
      return <MembersPanel spaceId={spaceId} />;
    case 'clues':
      return roomId ? (
        <CluesPanel
          spaceId={spaceId}
          roomId={roomId}
          onSeek={(query) => onSeek({ roomId, query })}
        />
      ) : (
        <WindowEmpty text="选择房间后查看线索" />
      );
    case 'combat':
      return roomId ? <CombatPanel key={roomId} /> : <WindowEmpty text="选择房间后记录先攻" />;
    case 'map':
      return roomId ? <MapPanel key={roomId} /> : <WindowEmpty text="选择房间后使用地图" />;
  }
}
