import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo, Mascot, SwapCoin, VerifiedBadge, CampusBadge, mascots } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/brand")({
  component: BrandGuide,
  head: () => ({
    meta: [
      { title: "SwapSpace Brand Style Guide — Logo, Colors & Mascots" },
      {
        name: "description",
        content:
          "The official SwapSpace brand style guide: logo lockup, amber and slate colour tokens, typography, mascot usage, pattern and UI components.",
      },
      { property: "og:title", content: "SwapSpace Brand Style Guide" },
      {
        property: "og:description",
        content: "Logo, colours, typography, mascots and pattern rules for the SwapSpace campus marketplace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const colors = [
  { name: "Primary / Amber", token: "bg-primary", hint: "--primary" },
  { name: "Ink Slate", token: "bg-ink", hint: "--ink" },
  { name: "Background", token: "bg-background border", hint: "--background" },
  { name: "Muted", token: "bg-muted", hint: "--muted" },
  { name: "Accent", token: "bg-accent", hint: "--accent" },
  { name: "Success", token: "bg-success", hint: "--success" },
  { name: "Destructive", token: "bg-destructive", hint: "--destructive" },
  { name: "Border", token: "bg-border", hint: "--border" },
];

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-extrabold sm:text-2xl">{title}</h2>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

function BrandGuide() {
  return (
    <div className="relative min-h-dvh bg-background">
      <div className="brand-pattern pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <Logo to="/" size={36} />
          <Button asChild variant="outline" size="sm" className="rounded-full shrink-0">
            <Link to="/">Back home</Link>
          </Button>
        </header>

        <div className="mt-10 max-w-2xl">
          <Badge className="rounded-full">Brand style guide</Badge>
          <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-5xl">
            The SwapSpace identity, in one place.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Everything you need to keep SwapSpace looking like SwapSpace — the lockup, our amber and
            slate palette, type, mascots and the hexagon pattern.
          </p>
        </div>

        <div className="mt-14 space-y-14">
          <Section
            title="Logo lockup"
            desc="Always pair the hexagon mark with the wordmark. Keep clear space equal to the mark's height and never recolour, stretch or crop it."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="flex items-center justify-center p-8">
                <Logo to="/brand" size={44} />
              </Card>
              <Card className="flex items-center justify-center bg-ink p-8">
                <Logo to="/brand" size={44} />
              </Card>
              <Card className="flex items-center justify-center gap-6 p-8">
                <Logo to="/brand" size={32} withWordmark={false} />
                <Logo to="/brand" size={24} withWordmark={false} />
                <Logo to="/brand" size={18} withWordmark={false} />
              </Card>
              <Card className="p-8 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Don't</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Place the mark on a busy photo without a solid chip behind it</li>
                  <li>Recolour the amber or add outlines / shadows</li>
                  <li>Use the wordmark below 14px height</li>
                </ul>
              </Card>
            </div>
          </Section>

          <Section
            title="Colour"
            desc="All colours are oklch design tokens. Use semantic classes — never hardcoded hex in components."
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {colors.map((c) => (
                <div key={c.name} className="min-w-0 rounded-2xl border bg-card p-3">
                  <div className={`h-16 w-full rounded-xl ${c.token}`} />
                  <p className="mt-2 truncate text-xs font-semibold">{c.name}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">{c.hint}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Typography"
            desc="Sora for display headings (tight tracking, extrabold). DM Sans for body and UI."
          >
            <Card className="space-y-4 p-6 sm:p-8">
              <p className="font-display text-3xl font-extrabold sm:text-4xl">Swap it. Don't buy it.</p>
              <p className="font-display text-xl font-bold">Section heading — Sora Bold</p>
              <p className="text-base">
                Body copy in DM Sans. Friendly, plain and campus-casual — short sentences, no jargon.
              </p>
              <p className="text-sm text-muted-foreground">
                Muted caption text for hints, timestamps and helper copy.
              </p>
            </Card>
          </Section>

          <Section
            title="Mascots"
            desc="Five cube mascots. Always show the full body — never crop hands or feet. Use them for empty states, onboarding and celebration moments."
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {(Object.keys(mascots) as Array<keyof typeof mascots>).map((v) => (
                <Card key={v} className="flex flex-col items-center gap-2 p-4">
                  <Mascot variant={v} size="sm" alt="" />
                  <p className="text-xs font-semibold capitalize">{v}</p>
                </Card>
              ))}
            </div>
          </Section>

          <Section
            title="Pattern"
            desc="The hexagon tile sits under content at low opacity with a soft amber gradient wash that fades out downward. Tiles scale with the viewport — never let it compete with content."
          >
            <div className="relative overflow-hidden rounded-3xl bg-ink text-ink-foreground">
              <div className="brand-pattern-subtle pointer-events-none absolute inset-0" aria-hidden />
              <div className="relative z-10 flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:text-left">
                <div className="min-w-0">
                  <p className="font-display text-2xl font-extrabold">Pattern on ink</p>
                  <p className="mt-2 text-sm text-ink-foreground/80">
                    Use <code className="font-mono">brand-pattern</code> for full pages and{" "}
                    <code className="font-mono">brand-pattern-subtle</code> inside cards and banners.
                  </p>
                </div>
                <div className="shrink-0 sm:ml-auto">
                  <Mascot variant="point" size="md" halo float alt="" />
                </div>
              </div>
            </div>
          </Section>

          <Section title="Components & signals" desc="Reusable trust and currency elements.">
            <Card className="flex flex-wrap items-center gap-3 p-6">
              <Button className="rounded-full">Primary</Button>
              <Button variant="secondary" className="rounded-full">
                Secondary
              </Button>
              <Button variant="outline" className="rounded-full">
                Outline
              </Button>
              <VerifiedBadge />
              <CampusBadge />
              <span className="inline-flex items-center gap-1 text-sm font-semibold">
                <SwapCoin size={18} /> SwapCoins
              </span>
            </Card>
          </Section>

          <Section title="Voice" desc="How SwapSpace sounds.">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Friendly, not cutesy", "Talk like a helpful senior, not a brand mascot."],
                ["Campus-specific", "Mention hostels, labs, semesters — it builds trust."],
                ["Short and clear", "One idea per sentence. Cut the filler."],
              ].map(([t, d]) => (
                <Card key={t} className="p-5">
                  <p className="font-display font-bold">{t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </Card>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
