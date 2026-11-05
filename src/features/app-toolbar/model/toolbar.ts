export type AppToolbarMode = 'home' | 'chat' | 'hidden';

export type AppToolbarPlacement = 'floating' | 'docked';

export type AppToolbarIcon = 'back' | 'chat' | 'characters' | 'windows';

export interface AppToolbarAction {
  label: string;
  icon: AppToolbarIcon;
  onTrigger: () => void;
}

export interface AppToolbarSearchContent {
  kind: 'search';
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export interface AppToolbarMessageInput {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}

export interface AppToolbarChatContent {
  kind: 'chat-switcher';
  message: AppToolbarMessageInput;
  search: Omit<AppToolbarSearchContent, 'kind'>;
}

export interface AppToolbarMenuItem {
  id: string;
  label: string;
  active?: boolean;
  onSelect: () => void;
}

export interface AppToolbarMenu {
  label: string;
  items: AppToolbarMenuItem[];
}

export interface AppToolbarDefinition {
  placement?: AppToolbarPlacement;
  leadingAction?: AppToolbarAction;
  content?: AppToolbarSearchContent | AppToolbarChatContent;
  menu?: AppToolbarMenu;
}

export function resolveAppToolbarMode(pathname: string): AppToolbarMode {
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  ) {
    return 'hidden';
  }
  if (pathname === '/message' || pathname.startsWith('/spaces/')) return 'chat';
  return 'home';
}
