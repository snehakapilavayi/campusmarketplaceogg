import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, HandCoins, Instagram, MessageCircle, Recycle, ShieldCheck, UploadCloud, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VerifiedBadge } from "@/components/brand";
import { Logo, Mascot } from "@/components/brand";
import { SUPPORT_MAILTO, SupportLink } from "@/components/support";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/lib/settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SwapSpace — The campus marketplace for students" },
      {
        name: "description",
        content:
          "Buy, rent and sell textbooks, gadgets, lab gear and hostel essentials inside your campus. Verified students only, no shipping, no strangers.",
      },
      { property: "og:title", content: "SwapSpace — The campus marketplace for students" },
      {
        property: "og:description",
        content: "Buy, rent and sell inside your campus. Verified students only.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://swapspace.lovable.app/" },
      { property: "og:image", content: "https://swapspace.lovable.app/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://swapspace.lovable.app/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://swapspace.lovable.app/" }],
  }),
  component: Landing,
});

const perks = [
  {
    icon: ShieldCheck,
    title: "Verified students only",
    body: "Every account is tied to a college email and reviewed before listings go live.",
  },
  {
    icon: Wallet,
    title: "Zero commission",
    body: "You settle in person — cash or UPI. SwapSpace never touches your money.",
  },
  {
    icon: Recycle,
    title: "Rent, don't waste",
    body: "Need a calculator for one exam? Rent it by the day instead of buying new.",
  },
];

const steps = [
  {
    icon: UploadCloud,
    title: "List",
    body: "Post what you want to sell, rent, or swap in under a minute.",
  },
  {
    icon: MessageCircle,
    title: "Chat",
    body: "Message verified students directly, negotiate price or swap terms.",
  },
  {
    icon: HandCoins,
    title: "Meet & Pay",
    body: "Meet on campus, pay cash or UPI. SwapSpace never touches your money.",
  },
];

/** Real counts only — nothing is shown until there is genuine data to show. */
function LiveStats() {
  const { data } = useQuery({
    queryKey: ["landing-stats"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [listings, students] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verification", "verified"),
      ]);
      return { listings: listings.count ?? 0, students: students.count ?? 0 };
    },
  });

  const items: { value: string; label: string }[] = [{ value: "0%", label: "commission" }];
  if ((data?.listings ?? 0) > 0) items.unshift({ value: String(data!.listings), label: "live listings" });
  if ((data?.students ?? 0) > 0) items.push({ value: String(data!.students), label: "verified students" });

  return (
    <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-6">
          {i > 0 && <div className="h-8 w-px bg-border" />}
          <div>
            <p className="font-display text-xl font-bold text-foreground">{item.value}</p>
            <p>{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function splitHero(text: string): [string, string] {
  const parts = text.split("|");
  return [parts[0]!.trim(), (parts[1] ?? "").trim()];
}

function Landing() {
  const { content } = useAppSettings();
  const [heroTitle, heroHighlight] = splitHero(content.hero_title);
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <Logo to="/" />
        <div className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" className="hidden rounded-full sm:inline-flex">
            <Link to="/how-it-works">How it works</Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/auth">Log in</Link>
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
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 md:grid-cols-2 md:pb-24 md:pt-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
              Built for students, by students
            </span>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] md:text-6xl">
              {heroTitle}
              {heroHighlight && <span className="block text-primary">{heroHighlight}</span>}
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">{content.hero_subtitle}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-7 shadow-[var(--shadow-amber)]">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Start swapping <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link to="/market">Browse listings</Link>
              </Button>
            </div>
            <LiveStats />
          </div>

          <div className="relative flex justify-center">
            <Mascot
              variant="wave"
              size="xl"
              halo
              float
              alt="SwapSpace mascot waving"
              className="md:scale-110"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {perks.map((perk) => (
            <div key={perk.title} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent">
                <perk.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <h2 className="mt-4 font-display text-lg font-bold">{perk.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{perk.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14">
        <h2 className="font-display text-2xl font-extrabold">How it works</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Three steps, start to handover.</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary font-display text-base font-extrabold text-primary-foreground">
                  {i + 1}
                </span>
                <step.icon className="h-5 w-5 text-muted-foreground" aria-hidden />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14">
        <div className="grid items-center gap-6 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8 md:grid-cols-2">
          <div>
            <VerifiedBadge />
            <h2 className="mt-4 font-display text-2xl font-extrabold">This is what verified looks like</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Every listing carries the seller's verification badge, so you always know you're dealing with a real
              student on your campus — exactly as it appears in the marketplace.
            </p>
            <Button asChild variant="outline" className="mt-6 rounded-full">
              <Link to="/market">See real listings</Link>
            </Button>
          </div>
          <div className="mx-auto w-full max-w-[13rem]">
            <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-soft)]">
              <div className="relative aspect-square bg-muted">
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                  For sale
                </span>
                <div className="absolute inset-0 grid place-items-center">
                  <Mascot variant="happy" size="sm" alt="" />
                </div>
                <span className="absolute bottom-2 left-2">
                  <VerifiedBadge compact />
                </span>
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-1 text-sm font-semibold">Casio FX-991EX calculator</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 font-display text-xs font-bold text-foreground ring-1 ring-primary/30">
                    ₹850
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Like new
                  </span>
                </div>
                <p className="pt-0.5 text-[11px] text-muted-foreground">Sample listing preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <Mascot variant="happy" size="sm" alt="" />
            <h2 className="mt-4 font-display text-xl font-extrabold">Have a college email?</h2>
            <p className="mt-1.5 flex-1 text-sm text-muted-foreground">
              Sign up with your <span className="font-semibold text-foreground">.edu.in</span> address and start
              buying, renting and selling right away.
            </p>
            <Button asChild size="lg" className="mt-6 w-full rounded-full">
              <Link to="/auth" search={{ mode: "signup" }}>
                Join with college email
              </Link>
            </Button>
          </div>

          <div className="flex flex-col rounded-3xl border border-primary/40 bg-accent/60 p-6 shadow-[var(--shadow-soft)]">
            <Mascot variant="idea" size="sm" alt="" />
            <h2 className="mt-4 font-display text-xl font-extrabold">Fresher without one yet?</h2>
            <p className="mt-1.5 flex-1 text-sm text-muted-foreground">
              Just joined campus and still waiting on your college ID? Sign up with your Gmail address and you're in
              instantly — no waiting, no approval queue.
            </p>
            <Button asChild size="lg" variant="outline" className="mt-6 w-full rounded-full bg-card">
              <Link to="/auth" search={{ mode: "signup", fresher: "1" }}>
                Join as a fresher
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-ink text-ink-foreground">
          <div className="brand-pattern-subtle pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative z-10 flex flex-col items-center gap-6 px-8 py-12 text-center md:flex-row md:items-end md:px-14 md:pb-0 md:pt-14 md:text-left">
            <div className="max-w-lg md:pb-14">
              <h2 className="font-display text-3xl font-extrabold text-ink-foreground md:text-4xl">
                Why buy it when someone on campus already has it?
              </h2>
              <p className="mt-3 text-sm text-ink-foreground/80">
                Swap what you have for what you need — simple, local, student-to-student.
              </p>
              <Button asChild size="lg" className="mt-7 rounded-full px-7">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create your account
                </Link>
              </Button>
            </div>
            <div className="w-40 shrink-0 self-end md:ml-auto md:w-56">
              <Mascot variant="point" size="xl" alt="" className="w-full [&_img]:h-auto [&_img]:w-full" />
            </div>
          </div>
        </div>
      </section>



      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-8 text-center text-xs text-muted-foreground">
          <Logo size={24} />
          <a
            href={content.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 font-medium text-accent-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            aria-label="Follow SwapSpace on Instagram"
          >
            <Instagram className="h-3.5 w-3.5" />
            @swapspace.in
          </a>
          <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
            <span>© 2026 Campus Marketplace · Made for Students, by Students</span>
            <span aria-hidden>·</span>
            <Link to="/privacy" className="text-muted-foreground underline-offset-2 hover:underline">
              Privacy
            </Link>
            <span aria-hidden>·</span>
            <Link to="/terms" className="text-muted-foreground underline-offset-2 hover:underline">
              Terms
            </Link>
            <span aria-hidden>·</span>
            <a
              href={SUPPORT_MAILTO}
              className="text-muted-foreground underline-offset-2 hover:underline"
            >
              Contact Us
            </a>
          </p>
          <SupportLink />
        </div>
      </footer>
    </div>
  );
}
