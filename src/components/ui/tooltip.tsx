import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';
import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, children, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 rounded-md bg-text px-2.5 py-1 text-xs text-app-bg shadow-sm animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 origin-[--radix-tooltip-content-transform-origin]',
      className,
    )}
    {...props}
  >
    {children}
    <TooltipPrimitive.Arrow className="fill-text" />
  </TooltipPrimitive.Content>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
