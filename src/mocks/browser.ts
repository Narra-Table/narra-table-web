import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export const workerOptions = { onUnhandledRequest: 'bypass' } as const;
