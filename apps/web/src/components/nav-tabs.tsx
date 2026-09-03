"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "首页" },
  { href: "/questions", label: "题库" },
  { href: "/practice/new", label: "练习" },
  { href: "/mistakes", label: "错题" },
  { href: "/stats", label: "统计" },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="主导航"
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:static md:border-b md:border-t-0"
    >
      <div className="flex justify-around md:justify-start md:gap-6 md:px-4">
        {tabs.map((t) => {
          const active =
            t.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "p-3 text-sm md:text-base transition-colors",
                "hover:text-primary",
                active && "font-bold text-primary"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
