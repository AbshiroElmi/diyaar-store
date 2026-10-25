import { useRef } from "react";
import poster from "@/assets/intro-poster.jpg";
import video from "@/assets/login-bg.mp4";
import { cn } from "@/lib/utils";

// The clip opens on a glass of wine and a restaurant's branded menu, and ends in front of a wine rack,
// so only the food in between is played, on a loop.
const START = 3;
const END = 12;

/** The built-in food video used on onboarding and login. */
export function IntroVideo({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const keepInRange = () => {
    const v = ref.current;
    if (v && (v.currentTime < START || v.currentTime >= END)) v.currentTime = START;
  };
  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      poster={poster}
      onLoadedMetadata={keepInRange}
      onTimeUpdate={keepInRange}
      onEnded={() => ref.current && ((ref.current.currentTime = START), ref.current.play().catch(() => undefined))}
      className={cn("object-cover", className)}
    >
      <source src={video} type="video/mp4" />
    </video>
  );
}
