export {
  createSequentialIdFactory,
  createWorkbenchStore,
  selectColumns,
  selectFocusedWindow,
  validateWorkspace,
  type WindowInstance,
  type WorkbenchStore,
} from './model';

export {
  createAppRegistry,
  useWorkbenchStore,
  Workbench,
  WorkbenchProvider,
  type RegisteredWindow,
  type WorkbenchMessages,
} from './ui';
