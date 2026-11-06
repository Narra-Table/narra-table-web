import { adminHandlers } from './adminHandlers';
import { authHandlers } from './authHandlers';
import { generatedHandlers } from './generatedHandlers';
import { spaceHandlers } from './spaceHandlers';

export const handlers = [...adminHandlers, ...authHandlers, ...spaceHandlers, ...generatedHandlers];
