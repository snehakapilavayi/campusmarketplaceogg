import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

export const easeOutSoft: Transition = { duration: 0.2, ease: [0.22, 1, 0.36, 1] };
export const springy: Transition = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 };

/** True once the client has hydrated — animations only run in the browser. */
export function useHydratedMotion() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}

/** Fade + subtle rise page transition. Opacity-only when reduced motion is on. */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={easeOutSoft}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Scroll-reveal wrapper: fades + rises once when it enters the viewport. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
      transition={{ ...easeOutSoft, duration: 0.35, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Press feedback wrapper for any clickable surface. */
export function Tap({
  children,
  className,
  scale = 0.94,
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div whileTap={reduce ? undefined : { scale }} transition={springy} className={cn(className)}>
      {children}
    </motion.div>
  );
}

/** Crossfade between a skeleton and loaded content. */
export function Crossfade({
  isLoading,
  skeleton,
  children,
}: {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.div key={isLoading ? "s" : "c"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={easeOutSoft}>
      {isLoading ? skeleton : children}
    </motion.div>
  );
}

/** Short vibration on supported devices — silently no-ops elsewhere. */
export function haptic(pattern: number | number[] = 12) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

export async function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  const colors = ["#E8A317", "#F6C453", "#2C3A42"];
  confetti({ particleCount: 70, spread: 62, origin: { y: 0.7 }, colors, scalar: 0.9 });
  setTimeout(() => confetti({ particleCount: 40, spread: 90, origin: { y: 0.6 }, colors, scalar: 0.8 }), 180);
}
