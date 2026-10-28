import type { IdFactory } from './ids';
import type {
  AttentionLevel,
  ColumnDisplay,
  Direction,
  FocusLayer,
  OpenWindowInput,
  WindowInstanceId,
  WindowPatch,
  WorkspaceState,
} from './types';

export type WorkbenchAction =
  | { type: 'workspace/replace'; state: WorkspaceState }
  | { type: 'workspace/scroll'; offset: number }
  | { type: 'window/open'; input: OpenWindowInput; instanceId: WindowInstanceId }
  | { type: 'window/close'; instanceId: WindowInstanceId }
  | { type: 'window/focus'; instanceId: WindowInstanceId; clearAttention?: boolean }
  | { type: 'window/focus-direction'; direction: Direction }
  | { type: 'window/focus-layer'; layer: FocusLayer }
  | { type: 'window/update'; instanceId: WindowInstanceId; patch: WindowPatch }
  | { type: 'window/set-state'; instanceId: WindowInstanceId; state: unknown }
  | {
      type: 'window/set-attention';
      instanceId: WindowInstanceId;
      level: AttentionLevel;
      payload?: unknown;
    }
  | {
      type: 'window/move-to-column';
      instanceId: WindowInstanceId;
      containerId: string;
      index?: number;
    }
  | {
      type: 'window/move-to-new-column';
      instanceId: WindowInstanceId;
      index?: number;
      width?: number;
    }
  | {
      type: 'container/merge';
      sourceId: string;
      targetId: string;
      mode: 'stack' | 'tab';
      index?: number;
    }
  | { type: 'container/move'; containerId: string; index: number }
  | { type: 'container/dissolve'; containerId: string }
  | { type: 'container/set-width'; containerId: string; width: number }
  | { type: 'container/toggle-full-width'; containerId: string }
  | { type: 'container/set-display'; containerId: string; display: ColumnDisplay }
  | { type: 'container/set-heights'; containerId: string; heights: number[] }
  | { type: 'container/equalize-rows'; containerId: string }
  | { type: 'floating/float'; instanceId: WindowInstanceId }
  | { type: 'floating/dock'; containerId: string; index?: number }
  | { type: 'floating/move'; containerId: string; x: number; y: number }
  | { type: 'floating/resize'; containerId: string; width: number; height: number }
  | { type: 'floating/raise'; containerId: string };

export interface ReduceOptions {
  createId?: IdFactory;
}
