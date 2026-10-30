export const SPACE_CARD_LAYOUT_STORAGE_KEY = 'narra-space-card-layout';

export const SPACE_CARD_LAYOUTS = ['portrait', 'mixed'] as const;

export type SpaceCardLayout = (typeof SPACE_CARD_LAYOUTS)[number];

export function isSpaceCardLayout(value: string | null): value is SpaceCardLayout {
  return SPACE_CARD_LAYOUTS.includes(value as SpaceCardLayout);
}

export function getStoredSpaceCardLayout(): SpaceCardLayout {
  if (typeof window === 'undefined') return 'portrait';
  const stored = localStorage.getItem(SPACE_CARD_LAYOUT_STORAGE_KEY);
  return isSpaceCardLayout(stored) ? stored : 'portrait';
}

export function saveSpaceCardLayout(layout: SpaceCardLayout): void {
  localStorage.setItem(SPACE_CARD_LAYOUT_STORAGE_KEY, layout);
}
