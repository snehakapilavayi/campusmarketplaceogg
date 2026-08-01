import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo, Mascot } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const searchSchema = z.object({
  mode: z.enum(["login", "signup", "forgot"]).catch("login"),
  next: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Log in or join — SwapSpace" },
      { name: "description", content: "Sign in with your college email to buy, rent and sell on campus." },
      { property: "og:title", content: "Log in or join — SwapSpace" },
      { property: "og:description", content: "Sign in with your college email to start swapping." },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const { mode, next } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  const destination = next && next.startsWith("/") ? next : "/market";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const parsed = z.string().email().safeParse(email.trim());
        if (!parsed.success) throw new Error("Enter a valid email");
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("reset");
        return;
      }

      const parsed = credentials.safeParse({ email, password });
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);

      if (mode === "signup") {
        if (name.trim().length < 2) throw new Error("Tell us your name");
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}${destination}`,
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent("confirm");
          return;
        }
        navigate({ to: "/onboarding" });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) throw error;
      toast.success("Welcome back 🍅");
      navigate({ to: destination });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Try email instead.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: destination });
  }

  if (sent) {
    return (
      <Shell>
        <div className="text-center">
          <Mascot variant="happy" className="mx-auto h-32 w-auto animate-float" alt="" />
          <h1 className="mt-4 font-display text-2xl font-extrabold">Check your inbox</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sent === "confirm"
              ? `We sent a confirmation link to ${email}. Click it to activate your SwapSpace account.`
              : `We sent a password reset link to ${email}.`}
          </p>
          <Button asChild variant="ghost" className="mt-6 rounded-full">
            <Link to="/auth" search={{ mode: "login" }} onClick={() => setSent(null)}>
              Back to log in
            </Link>
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-7 text-center">
        <Mascot variant={mode === "signup" ? "idea" : "wave"} className="mx-auto h-24 w-auto" alt="" />
        <h1 className="mt-3 font-display text-2xl font-extrabold">
          {mode === "signup" ? "Join your campus market" : mode === "forgot" ? "Reset your password" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "forgot"
            ? "We'll email you a secure reset link."
            : "Use your college email — it keeps SwapSpace students-only."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ananya Sharma"
              maxLength={80}
              required
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">College email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@vishnu.edu.in"
            autoComplete="email"
            required
          />
        </div>
        {mode !== "forgot" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {mode === "login" && (
                <Link
                  to="/auth"
                  search={{ mode: "forgot" }}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Forgot?
                </Link>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
            />
          </div>
        )}

        <Button type="submit" disabled={busy} className="w-full rounded-full" size="lg">
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Log in"}
        </Button>
      </form>

      {mode !== "forgot" && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button type="button" variant="outline" className="w-full rounded-full" size="lg" onClick={handleGoogle} disabled={busy}>
            Continue with Google
          </Button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>
            Already on SwapSpace?{" "}
            <Link to="/auth" search={{ mode: "login" }} className="font-semibold text-foreground underline-offset-4 hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link to="/auth" search={{ mode: "signup" }} className="font-semibold text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="brand-pattern pointer-events-none absolute inset-x-0 top-0 h-64" aria-hidden />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-lift)] sm:p-8">{children}</div>
      </div>
    </div>
  );
}
