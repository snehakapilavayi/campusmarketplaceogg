import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Image with a blurred placeholder that crossfades to the full photo on load.
 * Always renders inside a fixed-ratio box so nothing shifts while loading.
 */
export function SmartImage({
  src,
  alt,
  className,
  imgClassName,
  ratio = "aspect-square",
  layoutId,
  eager = false,
  fallback = "No photo",
}: {
  src?: string | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  ratio?: string;
  layoutId?: string;
  eager?: boolean;
  fallback?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const reduce = useReducedMotion();

  return (
    <div className={cn("relative overflow-hidden bg-muted", ratio, className)}>
      {!src ? (
        <div className="grid h-full place-items-center text-xs text-muted-foreground">{fallback}</div>
      ) : (
        <>
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 bg-muted transition-opacity duration-500",
              loaded ? "opacity-0" : "animate-pulse opacity-100",
            )}
          />
          <motion.img
            {...(layoutId ? { layoutId } : {})}
            src={src}
            alt={alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            initial={false}
            animate={{ opacity: loaded ? 1 : 0, filter: loaded || reduce ? "blur(0px)" : "blur(12px)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={cn("h-full w-full object-cover", imgClassName)}
          />
        </>
      )}
    </div>
  );
}
