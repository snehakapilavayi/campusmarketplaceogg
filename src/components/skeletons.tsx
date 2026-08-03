import { ListingCardSkeleton } from "@/components/listing-card";
import { cn } from "@/lib/utils";

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-3">
      <Shimmer className="h-20 w-20 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2 py-1">
        <Shimmer className="h-3.5 w-3/5" />
        <Shimmer className="h-3.5 w-1/4" />
        <Shimmer className="h-7 w-28 rounded-full" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}

export function ConversationSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <Shimmer className="h-11 w-11 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Shimmer className="h-3.5 w-1/3" />
            <Shimmer className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="space-y-3 py-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cn("flex", i % 2 ? "justify-end" : "justify-start")}>
          <Shimmer className={cn("h-9 rounded-2xl", i % 2 ? "w-40" : "w-52")} />
        </div>
      ))}
    </div>
  );
}
