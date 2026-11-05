import { adminHandlers } from './adminHandlers';
import { authHandlers } from './authHandlers';
import { generatedHandlers } from './generatedHandlers';
import { workbenchHandlers } from './workbenchHandlers';

export const handlers = [
  ...adminHandlers,
  ...authHandlers,
  ...workbenchHandlers,
  ...generatedHandlers,
];
