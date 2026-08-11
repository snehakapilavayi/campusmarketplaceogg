import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { classifyEmail, normalizeDomains, useAppSettings, type GeneralSettings } from "@/lib/settings";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Logo, Mascot } from "@/components/brand";
import { BackButton } from "@/components/app-shell";
import { ThemeToggle } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";

import { Label } from "@/components/ui/label";

const searchSchema = z.object({
  mode: z.enum(["login", "signup", "forgot"]).catch("login"),
  next: z.string().optional(),
  fresher: z.union([z.literal("1"), z.literal(1), z.boolean()]).optional(),
});


export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Log in or join — SwapSpace" },
      { name: "description", content: "Sign in with your college email to buy, rent and sell on campus." },
      { property: "og:title", content: "Log in or join — SwapSpace" },
      { property: "og:description", content: "Sign in with your college email to start swapping." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://swapspace.online/auth" },
      { property: "og:image", content: "https://swapspace.online/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://swapspace.online/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://swapspace.online/auth" }],
  }),
  component: AuthPage,
});

function validateEmail(raw: string, general: GeneralSettings, fresherLane: boolean) {
  const email = raw.trim().toLowerCase();
  const eduList = normalizeDomains(general.allowed_email_domains, ["edu.in"]);
  const fresherList = normalizeDomains(general.fresher_domains, ["gmail.com"]);
  if (!email || email.length > 255) return "Enter your email address";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
  const lane = classifyEmail(email, general);
  if (!lane) {
    return fresherLane
      ? `Freshers can join with ${fresherList.map((d) => `@${d}`).join(" or ")}`
      : `Use your college email (…${eduList[0]})`;
  }
  return null;
}


type Errors = Partial<Record<"name" | "email" | "password" | "confirm", string>>;

function AuthPage() {
  const { mode, next, fresher } = Route.useSearch();
  const { general } = useAppSettings();
  const fresherLane = fresher === "1" || fresher === 1 || fresher === true;
  const eduDomain = normalizeDomains(general.allowed_email_domains, ["edu.in"])[0]!;
  const fresherDomain = normalizeDomains(general.fresher_domains, ["gmail.com"])[0]!;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  const destination = next && next.startsWith("/") ? next : "/market";


  function clearError(key: keyof Errors) {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Errors = {};
    const emailError = validateEmail(email, general, fresherLane);
    if (emailError) nextErrors.email = emailError;

    if (mode !== "forgot") {
      if (password.length < 6) nextErrors.password = "Use at least 6 characters";
    }
    if (mode === "signup" && !general.signups_enabled) {
      toast.error("New signups are paused right now. Check back soon.");
      return;
    }
    if (mode === "signup") {
      if (name.trim().length < 2) nextErrors.name = "Tell us your name";
      if (confirm !== password) nextErrors.confirm = "Passwords don't match";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const cleanEmail = email.trim().toLowerCase();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("reset");
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${destination}`,
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          // Email confirmation is disabled — sign in straight away.
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (signInError) throw signInError;
        }
        toast.success("Welcome to SwapSpace");
        navigate({ to: "/onboarding" });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) throw error;
      toast.success("Welcome back");
      navigate({ to: destination });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Something went wrong";
      const isWeak = /weak|pwned|compromis|breach|easy to guess|leaked/i.test(raw);
      toast.error(isWeak ? "Please pick a slightly longer password and try again." : raw);



    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Shell>
        <div className="text-center">
          <Mascot variant="happy" size="md" halo float alt="" />
          <h1 className="mt-5 font-display text-2xl font-extrabold">Check your inbox</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sent === "confirm"
              ? `We sent a confirmation link to ${email.trim().toLowerCase()}. Click it to activate your SwapSpace account.`
              : `We sent a password reset link to ${email.trim().toLowerCase()}.`}
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
        <Mascot variant={mode === "signup" ? "idea" : "wave"} size="sm" halo alt="" />
        <h1 className="mt-4 font-display text-2xl font-extrabold">
          {mode === "signup" ? "Join your campus market" : mode === "forgot" ? "Reset your password" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {mode === "forgot"
            ? "We'll email you a secure reset link."
            : fresherLane
              ? `No college email yet? Sign up with @${fresherDomain} and you're in straight away.`
              : `Use your college email (…${eduDomain}) — it keeps SwapSpace students-only.`}
        </p>
      </div>

      {mode === "signup" && fresherLane && (
        <p className="mb-5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs font-medium text-foreground">
          Fresher accounts are approved instantly — browse, chat and list from the moment you sign up.
        </p>
      )}



      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {mode === "signup" && (
          <Field label="Full name" htmlFor="name" error={errors.name}>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError("name");
              }}
              placeholder="Ananya Sharma"
              maxLength={80}
              aria-invalid={!!errors.name}
            />
          </Field>
        )}

        <Field label={fresherLane ? "Email address" : "College email"} htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            placeholder={`yourname@${fresherLane ? fresherDomain : eduDomain}`}
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
        </Field>

        {mode !== "forgot" && (
          <Field
            label="Password"
            htmlFor="password"
            error={errors.password}
            action={
              mode === "login" ? (
                <Link
                  to="/auth"
                  search={{ mode: "forgot" }}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Forgot?
                </Link>
              ) : null
            }
          >
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError("password");
                }}
                placeholder="At least 6 characters"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                aria-invalid={!!errors.password}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
        )}

        {mode === "signup" && (
          <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
            <PasswordInput
              id="confirm"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                clearError("confirm");
              }}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirm}
            />

          </Field>
        )}


        <Button type="submit" disabled={busy} className="w-full rounded-full" size="lg">
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Log in"}
        </Button>
      </form>

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

function Field({
  label,
  htmlFor,
  error,
  action,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor}>{label}</Label>
        {action}
      </div>
      {children}
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="brand-pattern pointer-events-none absolute inset-x-0 top-0 h-64" aria-hidden />
      <div className="absolute left-4 top-4 z-10 sm:left-6">
        <BackButton />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-6 flex justify-center">
          <Logo to="/" size={36} />
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-lift)] sm:p-8">{children}</div>
      </div>
    </div>
  );
}
