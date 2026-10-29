import type { RoomMessage, SceneAnchor } from './types';

export function sceneId(messageId: string, blockIndex: number): string {
  return `${messageId}:${blockIndex}`;
}

export function sceneLabel(label: string | undefined): string {
  const text = label?.trim();
  return text ? text : '未命名分隔';
}

export function collectScenes(messages: readonly RoomMessage[]): SceneAnchor[] {
  const anchors: SceneAnchor[] = [];
  for (const message of messages) {
    if (message.deleted || !message.messageId) continue;
    const blocks = message.content ?? [];
    blocks.forEach((block, blockIndex) => {
      if (block.type !== 'divider' || !message.messageId) return;
      anchors.push({
        id: sceneId(message.messageId, blockIndex),
        messageId: message.messageId,
        blockIndex,
        label: sceneLabel(block.label),
      });
    });
  }
  return anchors;
}

export function findScene(anchors: readonly SceneAnchor[], id: string): SceneAnchor | undefined {
  return anchors.find((anchor) => anchor.id === id);
}
