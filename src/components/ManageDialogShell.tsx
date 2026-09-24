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
        className={`${width} max-h-[85vh] flex flex-col bg-slate-950 border border-cyan-400/30 text-slate-100`}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-mono text-cyan-400">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
          {children}
        </div>
        {footer && (
          <div className="flex justify-end gap-2 pt-2 border-t border-cyan-400/20">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
