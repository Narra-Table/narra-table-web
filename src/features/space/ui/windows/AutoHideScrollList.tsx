import * as ScrollArea from '@radix-ui/react-scroll-area';
import type { ReactNode } from 'react';
import { cn } from '@/lib/classNames';

interface AutoHideScrollListProps {
  as?: 'ol' | 'ul';
  children: ReactNode;
  className?: string;
}

export function AutoHideScrollList({
  as: List = 'ul',
  children,
  className,
}: AutoHideScrollListProps) {
  return (
    <ScrollArea.Root
      type="scroll"
      scrollHideDelay={1200}
      className="relative min-h-0 flex-1 overflow-hidden"
    >
      <ScrollArea.Viewport className="size-full">
        <List className={cn('flex min-h-full flex-col', className)}>{children}</List>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        forceMount
        orientation="vertical"
        className="flex w-2 touch-none select-none p-0.5 opacity-0 transition-opacity duration-300 data-[state=hidden]:pointer-events-none data-[state=visible]:opacity-100"
      >
        <ScrollArea.Thumb className="relative flex-1 bg-border" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}
