import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png.asset.json";
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
      <img
        src={logo.url}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="block shrink-0 object-contain drop-shadow-[0_1px_0_rgba(0,0,0,0.06)] dark:brightness-110"
      />
      {withWordmark && (
        <span
          className="font-display font-extrabold leading-none tracking-[-0.035em] text-foreground"
          style={{ fontSize: Math.round(size * 0.62) }}
        >
          Swap<span className="text-primary">Space</span>
        </span>
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
    <span className={cn("relative inline-flex shrink-0 items-end justify-center", className)}>
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
        height={1024}
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


export function TomatoRating({
  value,
  showValue = true,
  className,
}: {
  value: number;
  showValue?: boolean;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)} aria-label={`${value} out of 5 tomatoes`}>
      <span className="tracking-tight">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < rounded ? "" : "opacity-25"}>
            🍅
          </span>
        ))}
      </span>
      {showValue && <span className="font-medium text-muted-foreground">{Number(value).toFixed(1)}</span>}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  variant = "sad",
  action,
}: {
  title: string;
  description?: string;
  variant?: keyof typeof mascots;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <Mascot variant={variant} size="sm" halo float alt="" />
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-primary" aria-hidden>
        <path d="M12 2l2.4 1.8 3-.2.9 2.9 2.4 1.8-1.2 2.7 1.2 2.7-2.4 1.8-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9L3.3 15.7 4.5 13 3.3 10.3l2.4-1.8.9-2.9 3 .2z" />
      </svg>
      {compact ? "Verified" : "Vishnu Student Verified"}
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
