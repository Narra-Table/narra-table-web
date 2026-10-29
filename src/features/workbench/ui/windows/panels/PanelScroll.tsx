import type { ReactNode } from 'react';

export function PanelScroll({ children }: { children: ReactNode }) {
  return (
    <div className="scroll-subtle-native-hidden min-h-0 flex-1 overflow-y-auto px-3 py-3">
      {children}
    </div>
  );
}
