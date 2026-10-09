import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export const SUPPORT_EMAIL = "info.swapspace@gmail.com";

export function SupportLink({ className }: { className?: string }) {
  return (
    <a
      href={SUPPORT_MAILTO} target="_blank" rel="noopener noreferrer"
      className={cn("font-semibold text-primary underline-offset-2 hover:underline", className)}
    >
      Contact us
    </a>
  );
}

export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  "SwapSpace query",
)}&body=${encodeURIComponent("Hi SwapSpace team,\n\n")}`;

/** Icon button that opens the user's mail app straight to support. */
export function ContactUsButton({ className }: { className?: string }) {
  return (
    <a
      href={SUPPORT_MAILTO} target="_blank" rel="noopener noreferrer"
      className={cn(
        "grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label="Contact us"
      title="Contact us"
    >
      <Mail className="h-5 w-5" />
    </a>
  );
}

/** Subtle one-liner used in footers and empty states. */
export function SupportNote({
  label = "Need help or have a question?",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <p className={cn("inline-flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground", className)}>
      <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
      <SupportLink />
    </p>
  );
}
