import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TokenCalendarContent } from "./pageTokenUsage";
import { useI18n } from "@/components/i18n-provider";

export function TokenCalendarDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] bg-popover text-popover-foreground border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg text-cyan-600 dark:text-cyan-400">
            {t("token.usage")}
          </DialogTitle>
          <DialogDescription className="font-bold text-muted-foreground">
            {/* Token usage */}
          </DialogDescription>
        </DialogHeader>
        <TokenCalendarContent />
      </DialogContent>
    </Dialog>
  );
}