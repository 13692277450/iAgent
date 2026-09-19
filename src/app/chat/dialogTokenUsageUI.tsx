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
      <DialogContent className="max-w-[700px] bg-gray-300 border border-cyan-400/30 shadow-[0_0_40px_rgba(34,211,238,0.25)] backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-lg">TOKEN USAGE</DialogTitle>
          <DialogDescription className="text-md font-bold text-slate-500">
            {/* Token usage */}
          </DialogDescription>
        </DialogHeader>
        <TokenCalendarContent />
      </DialogContent>
    </Dialog>
  );
}
