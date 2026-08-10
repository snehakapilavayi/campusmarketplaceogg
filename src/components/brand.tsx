import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { SupportNote } from "@/components/support";

import logo from "@/assets/logo.png.asset.json";
import wordmark from "@/assets/wordmark.png.asset.json";
import swapcoin from "@/assets/swapcoin.png.asset.json";

import mascotWave from "@/assets/mascot-wave.png.asset.json";
import mascotSad from "@/assets/mascot-sad.png.asset.json";
import mascotHappy from "@/assets/mascot-happy.png.asset.json";
import mascotIdea from "@/assets/mascot-idea.png.asset.json";
import mascotPoint from "@/assets/mascot-point.png.asset.json";

export const mascots = {
  wave: mascotWave.url,
  sad: mascotSad.url,
  happy: mascotHappy.url,
  idea: mascotIdea.url,
  point: mascotPoint.url,
};

export function Logo({
  className,
  withWordmark = true,
  size = 32,
  to = "/market",
}: {
  className?: string;
  withWordmark?: boolean;
  size?: number;
  to?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      aria-label="SwapSpace home"
    >
      <span
        className="grid shrink-0 place-items-center overflow-visible"
        style={{ width: size, height: size }}
      >
        <img
          src={logo.url}
          alt=""
          width={size}
          height={size}
          style={{ width: size, height: size }}
          className="block h-full w-full shrink-0 object-contain object-center drop-shadow-[0_1px_0_rgba(0,0,0,0.06)] dark:brightness-110"
        />
      </span>
      {withWordmark && (
        <img
          src={wordmark.url}
          alt="SwapSpace"
          className="block w-auto select-none object-contain"
          style={{ height: Math.round(size * 0.6) }}
        />
      )}

    </Link>
  );
}

const mascotSizes = {
  sm: "h-24",
  md: "h-36",
  lg: "h-48",
  xl: "h-60",
} as const;

export function Mascot({
  variant = "wave",
  className,
  size = "md",
  halo = false,
  float = false,
  alt = "SwapSpace mascot",
}: {
  variant?: keyof typeof mascots;
  className?: string;
  size?: keyof typeof mascotSizes;
  halo?: boolean;
  float?: boolean;
  alt?: string;
}) {
  return (
    <span
      className={cn(
        // generous safe area so hands/feet never touch/clipped by the bounding box
        "relative inline-flex shrink-0 items-end justify-center overflow-visible p-[10%]",
        className,
      )}
    >
      {halo && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-2xl"
        />
      )}
      <img
        src={mascots[variant]}
        alt={alt}
        width={768}
        height={768}
        loading="lazy"
        className={cn(
          "relative block w-auto max-w-full select-none object-contain",
          mascotSizes[size],
          float && "animate-float",
        )}
      />
    </span>
  );
}


export function SwapCoin({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <img
      src={swapcoin.url}
      alt=""
      aria-hidden
      width={size}
      height={size}
      loading="lazy"
      style={{ width: size, height: size }}
      className={cn("inline-block shrink-0 select-none object-contain", className)}
    />
  );
}

const coinSizeFor = (className?: string) => {
  if (className?.includes("text-[9px]")) return 11;
  if (className?.includes("text-[10px]")) return 12;
  return 16;
};

/** SwapCoins rating — 5 coins earned through good swaps. */
export function CoinRating({
  value,
  showValue = true,
  className,
  size,
}: {
  value: number;
  showValue?: boolean;
  className?: string;
  size?: number;
}) {
  const rounded = Math.round(value);
  const coin = size ?? coinSizeFor(className);
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-sm", className)}
      aria-label={`${value} out of 5 SwapCoins`}
      title={`${Number(value).toFixed(1)} SwapCoins`}
    >
      <span className="inline-flex items-center gap-[2px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <SwapCoin
            key={i}
            size={coin}
            className={
              i < rounded
                ? "drop-shadow-[0_1px_2px_rgba(191,143,26,0.45)]"
                : "opacity-25 grayscale"
            }
          />
        ))}
      </span>
      {showValue && <span className="font-medium text-muted-foreground">{Number(value).toFixed(1)}</span>}
    </span>
  );
}

/** @deprecated use CoinRating */
export const TomatoRating = CoinRating;

export function EmptyState({
  title,
  description,
  variant = "sad",
  action,
  support = true,
}: {
  title: string;
  description?: string;
  variant?: keyof typeof mascots;
  action?: React.ReactNode;
  support?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <Mascot variant={variant} size="sm" halo float alt="" />
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action}
      {support && <SupportNote className="mt-2 max-w-xs" />}
    </div>
  );
}


export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-primary" aria-hidden>
        <path d="M12 2l2.4 1.8 3-.2.9 2.9 2.4 1.8-1.2 2.7 1.2 2.7-2.4 1.8-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9L3.3 15.7 4.5 13 3.3 10.3l2.4-1.8.9-2.9 3 .2z" />
      </svg>
      {compact ? "Verified" : "Verified student"}
    </span>
  );
}

export function CampusBadge({
  campus = "Campus",
  className,
}: {
  campus?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-foreground",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-primary" aria-hidden>
        <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3zm7 8.2V16c0 1.7-3.1 3-7 3s-7-1.3-7-3v-4.8l7 3.5 7-3.5z" />
      </svg>
      {campus?.trim() ? campus : "Campus"}
    </span>
  );
}

export function currency(value: number | string) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export const conditionLabels: Record<string, string> = {
  brand_new: "Brand New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  used: "Used",
};
