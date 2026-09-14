import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TokenCalendarContent } from "./pageTokenUsage";

export function TokenCalendarDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] bg-white border border-cyan-400/30 shadow-[0_0_40px_rgba(34,211,238,0.25)] backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-lg">TOKEN INFORMATION</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Check Token usage daily for each user
          </DialogDescription>
        </DialogHeader>
        <TokenCalendarContent />
      </DialogContent>
    </Dialog>
  );
}
