import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export const SUPPORT_EMAIL = "info.swapspace@gmail.com";

export function SupportLink({ className }: { className?: string }) {
  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}`}
      className={cn("font-semibold text-primary underline-offset-2 hover:underline", className)}
    >
      {SUPPORT_EMAIL}
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
