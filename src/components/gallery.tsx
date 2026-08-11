import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryImage = { url: string; sort_order: number };

/**
 * Swipeable listing gallery: snap-scrolling track on touch, arrows on desktop,
 * dot indicators, keyboard arrows, thumbnail strip and a fullscreen lightbox.
 * Every uploaded photo stays reachable — nothing is cropped out of the flow.
 */
export function ImageGallery({
  images,
  alt,
  layoutId,
}: {
  images: GalleryImage[];
  alt: string;
  layoutId?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = images.length;

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(index, track.children.length - 1));
    const child = track.children[next] as HTMLElement | undefined;
    if (child) track.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  }, []);

  // Keep the active dot in sync with wherever the user has scrolled to.
  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    setActive((prev) => (prev === index ? prev : index));
  }

  useEffect(() => {
    if (count < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") scrollTo(active + 1);
      if (e.key === "ArrowLeft") scrollTo(active - 1);
      if (e.key === "Escape") setLightbox(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, count, scrollTo]);

  if (count === 0) {
    return (
      <div className="grid aspect-square w-full place-items-center bg-muted text-sm text-muted-foreground sm:aspect-[16/10]">
        No photo yet
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="no-scrollbar flex aspect-square w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth sm:aspect-[16/10]"
          aria-label={`${alt} — photo gallery`}
        >
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setLightbox(true)}
              className="relative w-full shrink-0 snap-center bg-muted focus-visible:outline-none"
              aria-label={`Open photo ${i + 1} of ${count}`}
            >
              {i === 0 && layoutId ? (
                <motion.img
                  layoutId={layoutId}
                  src={img.url}
                  alt={`${alt} — photo ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={img.url}
                  alt={`${alt} — photo ${i + 1}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>

        {count > 1 && (
          <>
            <ArrowButton side="left" disabled={active === 0} onClick={() => scrollTo(active - 1)} />
            <ArrowButton side="right" disabled={active === count - 1} onClick={() => scrollTo(active + 1)} />
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-background/70 px-2 py-1.5 backdrop-blur-sm">
              {images.map((img, i) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  aria-current={i === active}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === active ? "w-6 bg-primary" : "w-1.5 bg-foreground/30 hover:bg-foreground/50",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="no-scrollbar mx-auto hidden max-w-3xl gap-2 overflow-x-auto px-4 pt-3 sm:flex">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Photo ${i + 1}`}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col bg-foreground/95"
            role="dialog"
            aria-modal="true"
            aria-label={`${alt} photos`}
          >
            <div className="flex justify-end p-3">
              <button
                type="button"
                onClick={() => setLightbox(false)}
                className="grid h-11 w-11 place-items-center rounded-full bg-background/15 text-background transition-colors hover:bg-background/25"
                aria-label="Close photos"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="no-scrollbar flex flex-1 snap-x snap-mandatory items-center overflow-x-auto overscroll-x-contain">
              {images.map((img, i) => (
                <div key={img.url} className="flex h-full w-full shrink-0 snap-center items-center justify-center p-4">
                  <img
                    src={img.url}
                    alt={`${alt} — photo ${i + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ))}
            </div>
            <p className="pb-[max(env(safe-area-inset-bottom),1rem)] pt-2 text-center text-xs font-medium text-background/80">
              Swipe to see all {count} photos
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ArrowButton({
  side,
  onClick,
  disabled,
}: {
  side: "left" | "right";
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={cn(
        "absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow-[var(--shadow-soft)] transition hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-0 sm:grid",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
