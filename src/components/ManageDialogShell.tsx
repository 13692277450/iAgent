"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ManageDialogShell({
  open,
  onOpenChange,
  title,
  children,
  footer,
  width = "max-w-4xl",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${width} flex max-h-[85vh] flex-col border border-border bg-popover text-popover-foreground shadow-2xl`}
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-sm text-cyan-600 dark:text-cyan-400">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
          {children}
        </div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-border pt-2">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
