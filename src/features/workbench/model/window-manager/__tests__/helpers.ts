import { createSequentialIdFactory } from '../ids';
import type { OpenWindowInput } from '../types';

export function windowInput(overrides: Partial<OpenWindowInput> = {}): OpenWindowInput {
  return {
    appId: 'demo',
    windowTypeId: 'note',
    title: 'Note',
    width: 0.5,
    ...overrides,
  };
}

export function idFactory(startAt = 0) {
  return createSequentialIdFactory(startAt);
}
