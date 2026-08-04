import { useEffect, useState } from "react";
import { Check, Copy, QrCode, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/motion";

export function ShareSheet({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || qr) return;
    let cancelled = false;
    import("qrcode").then(async ({ default: QRCode }) => {
      const data = await QRCode.toDataURL(url, { width: 512, margin: 1 });
      if (!cancelled) setQr(data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, qr, url]);

  async function share() {
    haptic();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user cancelled — fall through */
      }
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="h-11 rounded-full" onClick={share}>
          <Share2 className="mr-1.5 h-4 w-4" /> Share
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-11 rounded-full"
          onClick={() => setOpen(true)}
          aria-label="Show QR code"
        >
          <QrCode className="mr-1.5 h-4 w-4" /> QR
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Scan to open</DialogTitle>
            <DialogDescription>Point a phone camera at this code to open the listing.</DialogDescription>
          </DialogHeader>
          <div className="grid place-items-center rounded-2xl bg-card p-3">
            {qr ? (
              <img src={qr} alt="QR code for this listing" className="h-52 w-52 rounded-xl" />
            ) : (
              <div className="h-52 w-52 animate-pulse rounded-xl bg-muted" />
            )}
          </div>
          <Button variant="secondary" className="h-11 rounded-full" onClick={copy}>
            {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
