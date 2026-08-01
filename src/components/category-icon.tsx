import { Bike, BookOpen, Dumbbell, Lamp, Laptop, Package, PenLine, Shirt } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const map: Record<string, LucideIcon> = {
  Laptop,
  BookOpen,
  Shirt,
  Lamp,
  Dumbbell,
  PenLine,
  Bike,
  Package,
};

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && map[name]) || Package;
  return <Icon className={className} />;
}
