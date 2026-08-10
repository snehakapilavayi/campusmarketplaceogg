import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/image-compress";
import { useAuth } from "@/lib/auth";
import { findBlockedTerm, useAppSettings } from "@/lib/settings";
import { AppShell } from "@/components/app-shell";
import { Mascot } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { celebrate, haptic } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sell")({
  head: () => ({
    meta: [
      { title: "List an item — SwapSpace" },
      { name: "description", content: "Sell or rent out your stuff to students on your campus in under a minute." },
      { property: "og:title", content: "List an item — SwapSpace" },
      { property: "og:description", content: "Sell or rent out your stuff to students on campus." },
    ],
  }),
  component: SellPage,
});

const schema = z.object({
  title: z.string().trim().min(3, "Give your item a clear title").max(80),
  description: z.string().trim().max(1000).optional(),
  price: z.coerce.number().positive("Enter a price above 0").max(1000000),
  deposit: z.coerce.number().min(0).max(1000000).optional(),
});

const BUCKET = "listing-photos";
const MAX_SIZE = 5 * 1024 * 1024;
const SIGNED_TTL = 60 * 60 * 24 * 365 * 10;

const conditions = [
  { value: "brand_new", label: "Brand New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "used", label: "Used" },
] as const;

function SellPage() {
  const { userId } = useAuth();
  const { limits, moderation } = useAppSettings();
  const MAX_PHOTOS = limits.max_photos_per_listing;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [type, setType] = useState<"sell" | "rent">("sell");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [rentPeriod, setRentPeriod] = useState<"day" | "week" | "month">("day");
  const [condition, setCondition] = useState<string>("good");
  const [categoryId, setCategoryId] = useState<string>("");
  const [images, setImages] = useState<{ url: string; path: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: activeCount = 0 } = useQuery({
    queryKey: ["my-active-listing-count", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", userId!)
        .in("status", ["pending", "approved"]);
      return count ?? 0;
    },
  });

  const listingCap = limits.max_active_listings;
  const capReached = activeCount >= listingCap;

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const room = MAX_PHOTOS - images.length;
    if (room <= 0) {
      toast.error(`Up to ${MAX_PHOTOS} photos`);
      return;
    }
    setUploading(true);
    const uploaded: { url: string; path: string }[] = [];
    for (const file of files.slice(0, room)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} isn't an image`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} is over 5 MB`);
        continue;
      }
      const optimized = await compressImage(file);
      const ext = optimized.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, optimized, {
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) {
        toast.error(error.message);
        continue;
      }
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
      if (signed?.signedUrl) uploaded.push({ url: signed.signedUrl, path });
    }
    if (uploaded.length) setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function removeImage(path: string) {
    setImages((prev) => prev.filter((i) => i.path !== path));
    await supabase.storage.from(BUCKET).remove([path]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ title, description, price, deposit: deposit || 0 });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    if (capReached) {
      toast.error(`You've reached your limit of ${listingCap} active listings.`);
      return;
    }
    if (!categoryId) {
      toast.error("Pick a category");
      return;
    }
    if (parsed.data.price < limits.min_price || parsed.data.price > limits.max_price) {
      toast.error(`Price must be between ₹${limits.min_price} and ₹${limits.max_price}`);
      return;
    }
    if (moderation.auto_flag) {
      const blocked = findBlockedTerm(`${parsed.data.title} ${parsed.data.description ?? ""}`, moderation.blocklist);
      if (blocked) {
        toast.error(`"${blocked}" isn't allowed on SwapSpace. Please edit your listing.`);
        return;
      }
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("listings")
      .insert({
        seller_id: userId!,
        title: parsed.data.title,
        description: parsed.data.description || null,
        price: parsed.data.price,
        type,
        rent_period: type === "rent" ? rentPeriod : null,
        deposit: type === "rent" ? (parsed.data.deposit ?? 0) : null,
        condition: condition as (typeof conditions)[number]["value"],
        category_id: categoryId,
        status: "approved",
      })
      .select("id")
      .single();

    if (error || !data) {
      setBusy(false);
      toast.error(error?.message ?? "Couldn't create the listing");
      return;
    }

    if (images.length) {
      await supabase
        .from("listing_images")
        .insert(images.map((img, i) => ({ listing_id: data.id, url: img.url, sort_order: i })));
    }

    setBusy(false);
    queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
    celebrate();
    haptic([10, 40, 10]);
    toast.success("Your listing is live 🎉");
    navigate({ to: "/my-listings" });

  }

  return (
    <AppShell title="List an item">
      <form onSubmit={submit} className="space-y-6 pt-4">
        <div className="flex items-center gap-3 rounded-3xl bg-accent p-4">
          <Mascot variant="idea" className="[&_img]:h-16" alt="" />
          <p className="text-sm text-accent-foreground">
            Clear photos and an honest condition get you replies within hours.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["sell", "rent"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                type === t ? "border-primary bg-accent shadow-[var(--shadow-soft)]" : "border-border bg-card",
              )}
            >
              <p className="font-display font-bold">{t === "sell" ? "Sell it" : "Rent it out"}</p>
              <p className="text-xs text-muted-foreground">
                {t === "sell" ? "One-time handover" : "Get it back later"}
              </p>
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Casio FX-991 scientific calculator"
            maxLength={80}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="What's included, any scratches, why you're letting it go…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="price">{type === "rent" ? "Rent price (₹)" : "Price (₹)"}</Label>
            <Input
              id="price"
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="500"
              required
            />
          </div>
          {type === "rent" ? (
            <div className="space-y-1.5">
              <Label>Per</Label>
              <Select value={rentPeriod} onValueChange={(v) => setRentPeriod(v as typeof rentPeriod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {type === "rent" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deposit">Deposit (₹)</Label>
              <Input
                id="deposit"
                type="number"
                min={0}
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="photos">Photos</Label>
          <input
            ref={fileInputRef}
            id="photos"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              dragging ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted/60",
            )}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <UploadCloud className="h-6 w-6 text-primary" />
            )}
            <p className="text-sm font-semibold">
              {uploading ? "Uploading…" : "Drag photos here or tap to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              Up to {MAX_PHOTOS} photos · JPG or PNG · 5 MB each
            </p>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {images.map((img, i) => (
                <div
                  key={img.path}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(img.path)}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 shadow-[var(--shadow-soft)]"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" size="lg" disabled={busy || uploading} className="w-full rounded-full">
          {busy ? "Submitting…" : "Submit for review"}
        </Button>
      </form>
    </AppShell>
  );
}
