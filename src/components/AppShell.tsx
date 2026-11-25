"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";

// Telas sem menus: login e a política de privacidade (pública).
const SEM_MENU = ["/login", "/privacidade"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const semMenu = SEM_MENU.some((p) => pathname?.startsWith(p));

  return (
    <div className="flex flex-1 justify-center bg-bg">
      <div className="flex w-full max-w-[480px] flex-1 flex-col">
        {!semMenu && <TopBar />}
        <main className={`flex-1 overflow-y-auto px-4 pb-4 ${semMenu ? "pt-6" : "pt-2"}`}>
          {children}
        </main>
        {!semMenu && <BottomNav />}
      </div>
    </div>
  );
}
