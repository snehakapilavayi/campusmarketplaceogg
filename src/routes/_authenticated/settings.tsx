import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronRight, Laptop, Moon, Sun, Trash2, UserCog } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { deleteOwnAccount } from "@/lib/account.functions";
import { AppShell } from "@/components/app-shell";
import { CampusBadge } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SwapSpace" },
      {
        name: "description",
        content: "Appearance, notification preferences and account controls for your SwapSpace profile.",
      },
      { property: "og:title", content: "Settings — SwapSpace" },
      { property: "og:description", content: "Manage appearance, notifications and your SwapSpace account." },
    ],
  }),
  component: SettingsPage,
});

const NOTIF_KEY = "swapspace-notification-prefs";

type NotifPrefs = { messages: boolean; listings: boolean; announcements: boolean };
const defaultPrefs: NotifPrefs = { messages: true, listings: true, announcements: true };

const appearanceOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

function SettingsPage() {
  const { profile, signOut } = useAuth();
  const { mode, setMode } = useTheme();
  const navigate = useNavigate();
  const removeAccount = useServerFn(deleteOwnAccount);
  const [deleting, setDeleting] = useState(false);
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_KEY);
      if (raw) setPrefs({ ...defaultPrefs, ...(JSON.parse(raw) as Partial<NotifPrefs>) });
    } catch {
      /* ignore */
    }
  }, []);

  function updatePref(key: keyof NotifPrefs, value: boolean) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await removeAccount({ data: undefined });
      toast.success("Your account has been deleted");
      await signOut();
      void navigate({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Settings">
      <div className="space-y-5 pt-4">
        <Section title="Appearance" description="Choose how SwapSpace looks on this device.">
          <div className="grid grid-cols-3 gap-2">
            {appearanceOptions.map((option) => {
              const active = mode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-11 flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  <option.icon className={cn("h-5 w-5", active && "text-primary")} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Notifications" description="Control which alerts pop up while you browse.">
          <div className="divide-y divide-border">
            <PrefRow
              label="New messages"
              hint="Toast when a swap chat gets a reply"
              checked={prefs.messages}
              onChange={(v) => updatePref("messages", v)}
            />
            <PrefRow
              label="Listing updates"
              hint="Approvals, rejections and resubmit reminders"
              checked={prefs.listings}
              onChange={(v) => updatePref("listings", v)}
            />
            <PrefRow
              label="Campus announcements"
              hint="Events and notices from the SwapSpace team"
              checked={prefs.announcements}
              onChange={(v) => updatePref("announcements", v)}
            />
          </div>
        </Section>

        <Section title="Campus" description="SwapSpace is exclusive to Vishnu students.">
          <div className="flex items-center justify-between gap-3">
            <CampusBadge campus={profile?.campus ?? "VITB"} />
            <span className="text-xs text-muted-foreground">Locked to your college email</span>
          </div>
        </Section>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <Link
            to="/onboarding"
            className="flex min-h-11 items-center gap-3 p-4 hover:bg-muted/60"
          >
            <UserCog className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Edit profile</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>

        <Section title="Danger zone" description="This permanently removes your SwapSpace presence.">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                disabled={deleting}
                className="w-full rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> {deleting ? "Deleting…" : "Delete my profile"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your SwapSpace profile?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes your account, listings, chats, wishlist and cart. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Keep my account</AlertDialogCancel>
                <AlertDialogAction className="rounded-full" onClick={() => void handleDelete()}>
                  Delete forever
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <h2 className="font-display text-base font-bold">{title}</h2>
      {description && <p className="mb-4 mt-1 text-xs text-muted-foreground">{description}</p>}
      {children}
    </section>
  );
}

function PrefRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
