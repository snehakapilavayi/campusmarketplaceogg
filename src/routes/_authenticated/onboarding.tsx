import { Building2 } from "lucide-react";
import { useCampuses } from "@/lib/campuses";
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Mascot } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your profile — SwapSpace" },
      { name: "description", content: "Complete your student profile so buyers and sellers can trust you." },
      { property: "og:title", content: "Set up your profile — SwapSpace" },
      { property: "og:description", content: "Complete your student profile on SwapSpace." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { userId, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [campus, setCampus] = useState(profile?.campus ?? "");
  const [busy, setBusy] = useState(false);

  const { data: campuses = [] } = useCampuses();

  // Only one campus today — preselect it so there is zero friction.
  useEffect(() => {
    if (!campus && campuses.length === 1) setCampus(campuses[0]!.name);
  }, [campuses, campus]);

  async function finish() {
    if (fullName.trim().length < 2) {
      toast.error("Please enter your name");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        bio: bio.trim() || null,
        campus: campus.trim() || null,
        profile_complete: true,
      })
      .eq("id", userId!);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("You're all set");
    navigate({ to: "/market" });
  }

  const steps = [
    {
      title: "Welcome to SwapSpace",
      body: "A marketplace only for students on your campus. No shipping, no strangers — just a quick handover between classes.",
      mascot: "wave" as const,
    },
    {
      title: "Buy, rent or sell",
      body: "List anything from textbooks to mini fridges. Renting is perfect for things you only need for a semester.",
      mascot: "idea" as const,
    },
    {
      title: "Earn your SwapCoins rating",
      body: "After every swap both sides rate each other. Good ratings get you faster replies and more trust.",
      mascot: "happy" as const,
    },
  ];

  const current = steps[step];

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="brand-pattern pointer-events-none absolute inset-x-0 top-0 h-72" aria-hidden />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <Progress value={((step + 1) / (steps.length + 1)) * 100} className="mb-8 h-1.5" />

        {current ? (
          <div className="text-center">
            <Mascot variant={current.mascot} size="lg" halo float alt="" />
            <h1 className="mt-6 font-display text-3xl font-extrabold">{current.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{current.body}</p>
            <Button size="lg" className="mt-10 w-full rounded-full" onClick={() => setStep(step + 1)}>
              {step === steps.length - 1 ? "Set up my profile" : "Next"}
            </Button>
            <button
              onClick={() => setStep(steps.length)}
              className="mt-3 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-lift)]">
            <h1 className="font-display text-2xl font-extrabold">Your student profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">This is what other students see on your listings.</p>
            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="campus" className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-primary" aria-hidden />
                  Select campus
                </Label>
                <Select value={campus} onValueChange={setCampus}>
                  <SelectTrigger id="campus" className="h-12 rounded-2xl border-border bg-background px-4">
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {campuses.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio">Short bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={200}
                  rows={3}
                  placeholder="3rd year CSE · usually near the library"
                />
              </div>
            </div>
            <Button size="lg" className="mt-7 w-full rounded-full" onClick={finish} disabled={busy}>
              {busy ? "Saving…" : "Enter SwapSpace"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
