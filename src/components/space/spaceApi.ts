import { apiFetch } from '@/api/client';

export type Space = {
  id: string;
  name: string;
  system: string;
};

export const spaceApi = {
  list: () => apiFetch<Space[]>('/api/spaces'),
};
