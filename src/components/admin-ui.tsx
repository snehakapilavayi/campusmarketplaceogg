import { useEffect, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Download, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";

export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            value === o.value
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SelectAllRow({
  count,
  selected,
  onToggleAll,
  right,
}: {
  count: number;
  selected: number;
  onToggleAll: (checked: boolean) => void;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
      <Checkbox
        checked={count > 0 && selected === count}
        onCheckedChange={(c) => onToggleAll(c === true)}
        aria-label="Select all on this page"
      />
      <span className="text-xs text-muted-foreground">
        {selected > 0 ? `${selected} selected` : `${count} shown`}
      </span>
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </div>
  );
}

export function ExportButton({ onExport, disabled }: { onExport: () => void; disabled?: boolean }) {
  return (
    <Button variant="outline" size="sm" className="h-8 rounded-full" onClick={onExport} disabled={disabled}>
      <Download className="mr-1.5 h-3.5 w-3.5" />
      Export CSV
    </Button>
  );
}

export type BulkAction = {
  label: string;
  description?: string;
  destructive?: boolean;
  run: () => void | Promise<void>;
};

export function BulkBar({ count, actions, onClear }: { count: number; actions: BulkAction[]; onClear: () => void }) {
  if (count === 0) return null;
  return (
    <div className="sticky bottom-20 z-30 mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-card/95 p-3 shadow-[var(--shadow-lift)] backdrop-blur md:bottom-4">
      <span className="text-xs font-semibold">{count} selected</span>
      <div className="ml-auto flex flex-wrap gap-2">
        {actions.map((a) => (
          <AlertDialog key={a.label}>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant={a.destructive ? "ghost" : "outline"}
                className={cn("h-8 rounded-full", a.destructive && "text-destructive hover:text-destructive")}
              >
                {a.label}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {a.label} {count} {count === 1 ? "item" : "items"}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {a.description ?? "This action is recorded in the audit log."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                <AlertDialogAction className="rounded-full" onClick={() => void a.run()}>
                  {a.label}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ))}
        <Button size="sm" variant="ghost" className="h-8 rounded-full" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}

export function RiskBadge({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
      <ShieldAlert className="h-3 w-3" />
      {reasons.join(" · ")}
    </span>
  );
}

export function CampusSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-full border border-border bg-background px-3 text-xs font-medium"
      aria-label="Filter by campus"
    >
      <option value="all">All campuses</option>
      {options.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
      <option value="__none">No campus set</option>
    </select>
  );
}

export const REJECT_REASONS = [
  "Item doesn't fit any SwapSpace category",
  "Photos are unclear or missing",
  "Prohibited or unsafe item",
  "Price or description looks misleading",
  "Duplicate listing",
];

export const RESUBMIT_WINDOWS = [
  { days: 3, label: "3 days" },
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 0, label: "No deadline" },
];

/** Reject listings with a written reason + resubmission deadline shown to the student. */
export function RejectDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  count: number;
  onConfirm: (reason: string, deadline: string | null) => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setDays(7);
      setBusy(false);
    }
  }, [open]);

  const deadline =
    days > 0 ? new Date(Date.now() + days * 86400000) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            Reject {count} {count === 1 ? "listing" : "listings"}
          </DialogTitle>
          <DialogDescription>
            The student sees this note on their listing and gets a notification. Nothing is deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {REJECT_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                reason === r
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 300))}
          placeholder="Explain why this listing was rejected…"
          rows={3}
          className="rounded-xl"
        />
        <p className="text-[11px] text-muted-foreground">{reason.trim().length}/300</p>

        <DialogFooter>
          <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-full"
            disabled={reason.trim().length < 5 || busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm(reason.trim());
              onOpenChange(false);
            }}
          >
            Reject &amp; notify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Reassign a listing to a different category. */
export function CategorySelect({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string | null;
  options: { id: string; name: string }[];
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => e.target.value && onChange(e.target.value)}
      className="h-8 max-w-[10rem] rounded-full border border-border bg-background px-2.5 text-[11px] font-medium disabled:opacity-50"
      aria-label="Reassign category"
    >
      <option value="">Uncategorised</option>
      {options.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
