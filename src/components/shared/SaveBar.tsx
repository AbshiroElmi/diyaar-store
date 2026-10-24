import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Sticky "unsaved changes" bar; sits above the mobile tab bar. */
export function SaveBar({
  message = "Unsaved changes",
  onDiscard,
  onSave,
  saving,
  disabled,
  saveLabel = "Save",
}: {
  message?: string;
  onDiscard: () => void;
  onSave: () => void;
  saving?: boolean;
  disabled?: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t bg-background/95 p-3 backdrop-blur animate-in slide-in-from-bottom-4 lg:bottom-0 lg:left-64">
      <div className="mx-auto flex max-w-7xl items-center justify-end gap-2 px-1 sm:px-3">
        <span className="mr-auto text-sm text-muted-foreground">{message}</span>
        <Button variant="ghost" onClick={onDiscard}>
          Discard
        </Button>
        <Button onClick={onSave} disabled={saving || disabled}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {saveLabel}
        </Button>
      </div>
    </div>
  );
}
