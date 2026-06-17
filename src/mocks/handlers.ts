import { characterHandlers } from './handlers/characters';
import { maskHandlers } from './handlers/masks';
import { messageHandlers } from './handlers/messages';
import { resourceHandlers } from './handlers/resources';
import { roomHandlers } from './handlers/rooms';
import { spaceHandlers } from './handlers/spaces';

export const handlers = [
  ...spaceHandlers,
  ...roomHandlers,
  ...maskHandlers,
  ...characterHandlers,
  ...messageHandlers,
  ...resourceHandlers,
];
