import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo, Mascot } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — SwapSpace" },
      { name: "description", content: "Choose a new password for your SwapSpace campus account." },
      { property: "og:title", content: "Set a new password — SwapSpace" },
      { property: "og:description", content: "Choose a new password for your SwapSpace account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/market" });
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="brand-pattern pointer-events-none absolute inset-x-0 top-0 h-64" aria-hidden />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-lift)] sm:p-8">
          <div className="mb-6 text-center">
            <Mascot variant="idea" className="mx-auto h-24 w-auto" alt="" />
            <h1 className="mt-3 font-display text-2xl font-extrabold">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Make it something you'll remember.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pw">New password</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw2">Confirm password</Label>
              <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" size="lg" disabled={busy} className="w-full rounded-full">
              {busy ? "Updating…" : "Update password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
