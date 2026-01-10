import * as React from "react";
import { cn } from "@ui/lib/utils";
import {
  ScrollArea,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner
} from "@ui/components/ui/scroll-area";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <ScrollArea
        className={cn(
          "h-full w-full rounded-md focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          className
        )}
      >
        <ScrollAreaViewport asChild className="h-full w-full">
          <textarea
            className={cn(
              "flex h-full min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            )}
            ref={ref}
            {...props}
          />
        </ScrollAreaViewport>
        <ScrollAreaScrollbar orientation="vertical">
          <ScrollAreaThumb />
        </ScrollAreaScrollbar>
        <ScrollAreaScrollbar orientation="horizontal">
          <ScrollAreaThumb />
        </ScrollAreaScrollbar>
        <ScrollAreaCorner />
      </ScrollArea>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
