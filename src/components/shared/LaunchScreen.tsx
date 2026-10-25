import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import hand from "@/assets/logo-hand.png";

// Same colours and logo size as the native splash (assets/splash*.png), so the hand-off is seamless.
const DARK = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;

/** Little hearts that pop out of the finger-heart and float away. */
const HEARTS = [
  { x: -34, delay: 0.35, size: 18 },
  { x: 8, delay: 0.75, size: 24 },
  { x: 40, delay: 1.15, size: 16 },
];

/** The animated launch screen: the hand bobs, gives a little snap, and sends hearts up. */
export function LaunchScreen() {
  const still = useReducedMotion();
  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center"
      style={{ backgroundColor: DARK ? "#0F4F48" : "#219186" }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeOut" } }}
    >
      <div className="relative" style={{ width: "16vh", height: "16vh" }}>
        {!still &&
          HEARTS.map((h, i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-[8%] text-[#BEFF00]"
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 1, 0], x: h.x, y: -70, scale: [0.4, 1.1, 1, 0.8], rotate: h.x / 3 }}
              transition={{ duration: 1.3, delay: h.delay, ease: "easeOut", repeat: Infinity, repeatDelay: 0.6 }}
            >
              <Heart className="fill-current" style={{ width: h.size, height: h.size }} strokeWidth={0} />
            </motion.span>
          ))}
        <motion.img
          src={hand}
          alt="Diyaar"
          className="relative h-full w-full select-none"
          draggable={false}
          style={{ transformOrigin: "50% 85%" }}
          animate={
            still
              ? undefined
              : {
                  // a gentle bob, then a quick "snap" wiggle
                  y: [0, -6, 0, 0, 0, 0],
                  rotate: [0, 0, -9, 7, -3, 0],
                  scale: [1, 1.03, 1.06, 1, 1, 1],
                }
          }
          transition={{ duration: 1.4, times: [0, 0.25, 0.45, 0.6, 0.75, 1], ease: "easeInOut", repeat: Infinity, repeatDelay: 0.4 }}
        />
      </div>
    </motion.div>
  );
}
