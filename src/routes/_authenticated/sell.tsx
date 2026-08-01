import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
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

const conditions = [
  { value: "brand_new", label: "Brand New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "used", label: "Used" },
] as const;

function SellPage() {
  const { userId } = useAuth();
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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

  function addImage() {
    const url = imageInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Paste a valid image link (https://…)");
      return;
    }
    if (imageUrls.length >= 5) {
      toast.error("Up to 5 photos");
      return;
    }
    setImageUrls([...imageUrls, url]);
    setImageInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ title, description, price, deposit: deposit || 0 });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    if (!categoryId) {
      toast.error("Pick a category");
      return;
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
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !data) {
      setBusy(false);
      toast.error(error?.message ?? "Couldn't create the listing");
      return;
    }

    if (imageUrls.length) {
      await supabase
        .from("listing_images")
        .insert(imageUrls.map((url, i) => ({ listing_id: data.id, url, sort_order: i })));
    }

    setBusy(false);
    queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    toast.success("Listing submitted — admin review is usually quick");
    navigate({ to: "/my-listings" });
  }

  return (
    <AppShell title="List an item">
      <form onSubmit={submit} className="space-y-6 pt-4">
        <div className="flex items-center gap-3 rounded-3xl bg-accent p-4">
          <Mascot variant="idea" className="h-16 w-auto" alt="" />
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
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Photos</Label>
          <div className="flex gap-2">
            <Input
              id="image"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              placeholder="Paste an image link"
            />
            <Button type="button" variant="outline" onClick={addImage} className="shrink-0">
              <ImagePlus className="h-4 w-4" />
            </Button>
          </div>
          {imageUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imageUrls.map((url, i) => (
                <div key={url} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrls(imageUrls.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" size="lg" disabled={busy} className="w-full rounded-full">
          {busy ? "Submitting…" : "Submit for review"}
        </Button>
      </form>
    </AppShell>
  );
}
