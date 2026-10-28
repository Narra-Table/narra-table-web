import { createAppRegistry, type RegisteredWindow } from '@/features/workbench/react';
import { WINDOW_INFO, WINDOW_KINDS, type WindowKind } from './apps/windows';

export const WORKBENCH_APP_ID = 'narratable';

export const WORKBENCH_REGISTRY = createAppRegistry(
  WINDOW_KINDS.map(
    (kind): RegisteredWindow => ({
      appId: WORKBENCH_APP_ID,
      windowTypeId: kind,
      title: WINDOW_INFO[kind].title,
      appName: 'NarraTable',
      defaultWidth: kind === 'chat' ? 2 / 3 : 0.5,
      defaultDisplay: 'normal',
      chrome: 'full',
      floating: false,
      modal: false,
      singleton: false,
      embeddable: true,
      launcher: true,
    }),
  ),
);

export function isWorkbenchWindowKind(value: string): value is WindowKind {
  return (WINDOW_KINDS as readonly string[]).includes(value);
}

export function workbenchWindowTitle(kind: WindowKind): string {
  return WINDOW_INFO[kind].title;
}
