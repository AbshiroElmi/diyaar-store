import { useState } from "react";
import { Loader2, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shown instead of content when the app can't get through.
 * `offline`: the phone has no internet at all; otherwise the server didn't answer in time.
 */
export function NoInternet({ offline = true, onRetry, className }: { offline?: boolean; onRetry?: () => unknown; className?: string }) {
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center px-8 text-center", className)}>
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <WifiOff className="h-9 w-9" strokeWidth={2} />
      </span>
      <p className="mt-5 text-[20px] font-bold tracking-tight">{offline ? "No internet connection" : "Can't reach Diyaar"}</p>
      <p className="mt-1.5 max-w-[280px] text-[15px] leading-snug text-black/55 dark:text-white/55">
        {offline ? "Check your Wi-Fi or mobile data. The app reloads as soon as you're back online." : "Your connection may be weak. Check your internet and try again."}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={retry}
          disabled={retrying}
          className="mt-6 inline-flex h-11 min-w-[160px] items-center justify-center rounded-xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-70"
        >
          {retrying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Try again"}
        </button>
      )}
    </div>
  );
}
