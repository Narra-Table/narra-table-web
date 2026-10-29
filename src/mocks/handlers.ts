import { adminHandlers } from './adminHandlers';
import { authHandlers } from './authHandlers';
import { generatedHandlers } from './generatedHandlers';

export const handlers = [...adminHandlers, ...authHandlers, ...generatedHandlers];
