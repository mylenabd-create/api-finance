"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Flame, Calendar, Sparkles } from "lucide-react";

const items = [
  { href: "/", label: "Início", icon: Home },
  { href: "/financas", label: "Finanças", icon: Wallet },
  { href: "/habitos", label: "Hábitos", icon: Flame },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/espiritual", label: "Espiritual", icon: Sparkles },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-around border-t border-line bg-bg-panel px-2 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 ${
              active ? "text-accent" : "text-text-dim"
            }`}
          >
            <Icon size={19} />
            <span className="text-[10px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
