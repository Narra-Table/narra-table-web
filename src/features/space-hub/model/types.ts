import type { InternalHandlerSpaceSummary } from '@/api/model';

export type SpaceListItem = InternalHandlerSpaceSummary & {
  avatar?: string;
};
