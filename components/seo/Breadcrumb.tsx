import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { name: string; href: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-xs text-text-secondary"
    >
      {items.map((item, idx) => {
        const last = idx === items.length - 1;
        return (
          <span key={item.href} className="flex items-center gap-1">
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            {last ? (
              <span className="text-text-primary" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link href={item.href} className="hover:text-brand">
                {item.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
