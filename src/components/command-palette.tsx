import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutGrid,
  Heart,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { currency } from "@/components/brand";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

  const { data: listings = [] } = useQuery({
    queryKey: ["command-search", term],
    enabled: open && term.trim().length > 1,
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("id,title,price,type")
        .eq("status", "approved")
        .ilike("title", `%${term.trim()}%`)
        .limit(6);
      return data ?? [];
    },
  });

  function go(fn: () => void) {
    setOpen(false);
    setTerm("");
    fn();
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput value={term} onValueChange={setTerm} placeholder="Search listings, categories, actions…" />
      <CommandList>
        <CommandEmpty>Nothing found. Try another word.</CommandEmpty>

        {listings.length > 0 && (
          <CommandGroup heading="Listings">
            {listings.map((l) => (
              <CommandItem
                key={l.id}
                value={`listing-${l.title}`}
                onSelect={() => go(() => navigate({ to: "/listing/$id", params: { id: l.id } }))}
              >
                <Search className="mr-2 h-4 w-4" />
                <span className="truncate">{l.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">{currency(l.price)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Go to">
          <CommandItem value="sell list item" onSelect={() => go(() => navigate({ to: "/sell" }))}>
            <Plus className="mr-2 h-4 w-4" /> List an item
          </CommandItem>
          <CommandItem value="market browse" onSelect={() => go(() => navigate({ to: "/market" }))}>
            <Search className="mr-2 h-4 w-4" /> Marketplace
          </CommandItem>
          <CommandItem value="categories" onSelect={() => go(() => navigate({ to: "/categories" }))}>
            <LayoutGrid className="mr-2 h-4 w-4" /> Categories
          </CommandItem>
          <CommandItem value="wishlist saved" onSelect={() => go(() => navigate({ to: "/wishlist" }))}>
            <Heart className="mr-2 h-4 w-4" /> Wishlist
          </CommandItem>
          <CommandItem value="chat messages" onSelect={() => go(() => navigate({ to: "/chat" }))}>
            <MessageCircle className="mr-2 h-4 w-4" /> Messages
          </CommandItem>
          <CommandItem value="profile account" onSelect={() => go(() => navigate({ to: "/profile" }))}>
            <User className="mr-2 h-4 w-4" /> Account
          </CommandItem>
        </CommandGroup>

        {categories.length > 0 && (
          <CommandGroup heading="Categories">
            {categories.slice(0, 8).map((c) => (
              <CommandItem
                key={c.id}
                value={`category-${c.name}`}
                onSelect={() => go(() => navigate({ to: "/categories" }))}
              >
                <LayoutGrid className="mr-2 h-4 w-4" /> {c.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {isAdmin && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Admin">
              <CommandItem value="admin dashboard" onSelect={() => go(() => navigate({ to: "/admin" }))}>
                <ShieldCheck className="mr-2 h-4 w-4" /> Admin dashboard
              </CommandItem>
              <CommandItem value="admin listings moderation" onSelect={() => go(() => navigate({ to: "/admin/listings" }))}>
                <ShieldCheck className="mr-2 h-4 w-4" /> Moderate listings
              </CommandItem>
              <CommandItem value="admin reports" onSelect={() => go(() => navigate({ to: "/admin/reports" }))}>
                <ShieldCheck className="mr-2 h-4 w-4" /> Reports
              </CommandItem>
              <CommandItem value="admin students" onSelect={() => go(() => navigate({ to: "/admin/students" }))}>
                <ShieldCheck className="mr-2 h-4 w-4" /> Students
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
