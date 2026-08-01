import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Recycle, ShieldCheck, Wallet } from "lucide-react";
import { Logo, Mascot } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SwapSpace — The campus marketplace for students" },
      {
        name: "description",
        content:
          "Buy, rent and sell textbooks, cycles, gadgets and hostel gear inside your campus. Verified students only, no shipping, no strangers.",
      },
      { property: "og:title", content: "SwapSpace — The campus marketplace for students" },
      {
        property: "og:description",
        content: "Buy, rent and sell inside your campus. Verified students only.",
      },
    ],
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

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
        <Logo />
        <div className="flex items-center gap-2">
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
              🍅 Built for Vishnu students
            </span>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] md:text-6xl">
              Buy. Rent. Sell.
              <span className="block text-primary">Inside your campus.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              SwapSpace is the marketplace for the stuff that already lives on your campus — textbooks, cycles,
              lab coats, mini fridges. Meet at the canteen, hand it over, done.
            </p>
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
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div>
                <p className="font-display text-xl font-bold text-foreground">8</p>
                <p>categories</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="font-display text-xl font-bold text-foreground">0%</p>
                <p>commission</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="font-display text-xl font-bold text-foreground">1</p>
                <p>campus, no strangers</p>
              </div>
            </div>
          </div>

          <div className="relative flex items-end justify-center gap-2">
            <Mascot variant="point" className="h-40 w-auto md:h-52" alt="" />
            <Mascot variant="wave" className="h-56 w-auto animate-float md:h-72" alt="SwapSpace mascot waving" />
            <Mascot variant="idea" className="h-36 w-auto md:h-44" alt="" />
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

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-secondary px-8 py-12 text-secondary-foreground md:px-14">
          <div className="relative z-10 max-w-lg">
            <h2 className="font-display text-3xl font-extrabold md:text-4xl">
              That cycle in your hostel parking? Someone needs it today.
            </h2>
            <p className="mt-3 text-sm text-secondary-foreground/80">
              List it in under a minute. Get a 🍅 rating for every good swap.
            </p>
            <Button asChild size="lg" className="mt-7 rounded-full px-7">
              <Link to="/auth" search={{ mode: "signup" }}>
                Create your account
              </Link>
            </Button>
          </div>
          <Mascot
            variant="happy"
            className="absolute -bottom-4 right-4 hidden h-56 w-auto md:block"
            alt=""
          />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 py-8 text-center text-xs text-muted-foreground">
          <Logo size={24} />
          <p>Campus-exclusive marketplace. Meet safely, on campus, in daylight.</p>
        </div>
      </footer>
    </div>
  );
}
