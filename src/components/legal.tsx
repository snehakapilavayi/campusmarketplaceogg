import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand";
import { BackButton } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/components/support";

export const LEGAL_LAST_UPDATED = "11 August 2026";

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="font-display text-xl font-extrabold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function LegalSubheading({ children }: { children: ReactNode }) {
  return <h3 className="pt-1 font-display text-sm font-bold text-foreground">{children}</h3>;
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-5 list-disc space-y-1.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function SupportEmailLink() {
  return (
    <a href={SUPPORT_MAILTO} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground underline underline-offset-2">
      {SUPPORT_EMAIL}
    </a>
  );
}

export function LegalPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-20 max-w-4xl items-center justify-between gap-3 px-5">
        <div className="flex items-center gap-2">
          <BackButton />
          <Logo to="/" />
        </div>
        <Button asChild className="rounded-full">
          <Link to="/market">Browse</Link>
        </Button>
      </header>

      <div className="relative overflow-hidden">
        <div className="brand-pattern pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-6">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
            {eyebrow}
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.1]">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Last updated:</span> {LEGAL_LAST_UPDATED}
          </p>
          <div className="mt-2">{children}</div>

          <div className="mt-12 flex flex-wrap gap-3 text-xs">
            <Link to="/privacy" className="text-muted-foreground underline-offset-2 hover:underline">
              Privacy
            </Link>
            <Link to="/terms" className="text-muted-foreground underline-offset-2 hover:underline">
              Terms
            </Link>
            <a href={SUPPORT_MAILTO} target="_blank" rel="noopener noreferrer" className="text-muted-foreground underline-offset-2 hover:underline">
              Contact us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
