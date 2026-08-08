import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, HandCoins, Instagram, MessageCircle, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import { Logo, Mascot } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/lib/theme";

const SITE = "https://college-swap-link.lovable.app";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How SwapSpace works — campus buying, renting & selling" },
      {
        name: "description",
        content:
          "Verify with your college email, list in a minute, chat with the student, meet on campus and swap. No commission, no shipping, no strangers.",
      },
      { property: "og:title", content: "How SwapSpace works" },
      {
        property: "og:description",
        content: "Five simple steps from listing to handover on your own campus.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/how-it-works` },
      { property: "og:image", content: `${SITE}/og-image.jpg` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE}/og-image.jpg` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/how-it-works` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How SwapSpace works",
          step: [
            { "@type": "HowToStep", name: "Verify with your college email" },
            { "@type": "HowToStep", name: "List your item in a minute" },
            { "@type": "HowToStep", name: "Chat with the student" },
            { "@type": "HowToStep", name: "Meet on campus and swap" },
            { "@type": "HowToStep", name: "Rate each other with SwapCoins" },
          ],
        }),
      },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  {
    icon: ShieldCheck,
    title: "Verify with your college email",
    body: "Only @vishnu.edu.in addresses can join, so everyone you deal with is a student on your campus.",
  },
  {
    icon: UploadCloud,
    title: "List it in under a minute",
    body: "Snap a few photos, set a price, choose sell or rent. Our team reviews listings before they go live.",
  },
  {
    icon: MessageCircle,
    title: "Chat in-app",
    body: "Buyers message you directly. Agree on a price, a time and a spot — canteen, library, hostel gate.",
  },
  {
    icon: HandCoins,
    title: "Meet and swap",
    body: "Pay in person with cash or UPI. SwapSpace never touches your money and takes 0% commission.",
  },
  {
    icon: Sparkles,
    title: "Earn SwapCoins",
    body: "Every good swap earns you SwapCoins — our 5-coin trust rating, so the next student knows you're reliable.",
  },
];

const safety = [
  "Meet in busy, well-lit campus spots during the day.",
  "Inspect the item fully before handing over any money.",
  "Keep the conversation inside SwapSpace so it can be reviewed.",
  "Report anything that feels off — admins act on reports quickly.",
];

function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-5">
        <Logo to="/" />
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden rounded-full sm:inline-flex">
            <Link to="/market">Browse</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link to="/auth" search={{ mode: "signup" }}>
              Join
            </Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="brand-pattern pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 pb-12 pt-6 md:grid-cols-[1.3fr_1fr] md:pb-20 md:pt-12">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
              How it works
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              From your shelf to another
              <span className="block text-primary">student's hands.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              SwapSpace keeps every trade inside your college. No shipping, no payment gateways, no strangers — just
              students handing things over between classes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7 shadow-[var(--shadow-amber)]">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link to="/market">See what's listed</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <Mascot variant="point" size="lg" halo float alt="SwapSpace mascot pointing" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-12">
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent">
                <step.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Step {i + 1}</p>
                <h2 className="mt-0.5 font-display text-lg font-bold">{step.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-secondary px-6 py-10 text-secondary-foreground sm:px-10">
          <div className="brand-pattern-subtle pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative z-10">
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Swap safely</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {safety.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm text-secondary-foreground/85">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-8 text-center text-xs text-muted-foreground">
          <Logo size={24} />
          <a
            href="https://www.instagram.com/swapspace.in?igsh=MWZ4NHUyeHI0bTEyZA=="
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 font-medium text-accent-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            aria-label="Follow SwapSpace on Instagram"
          >
            <Instagram className="h-3.5 w-3.5" />
            @swapspace.in
          </a>
          <p>Campus-exclusive marketplace. Meet safely, on campus, in daylight.</p>
        </div>
      </footer>
    </div>
  );
}
