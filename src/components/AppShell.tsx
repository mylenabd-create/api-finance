"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";

// Telas sem menus: login e a política de privacidade (pública).
const SEM_MENU = ["/login", "/privacidade"];

// Celular: menu no topo. Computador (lg+): menu lateral fixo e conteúdo largo.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const semMenu = SEM_MENU.some((p) => pathname?.startsWith(p));

  if (semMenu) {
    return (
      <div className="flex flex-1 justify-center bg-bg">
        <main className="w-full max-w-[480px] flex-1 px-4 pb-6 pt-6 lg:max-w-[640px]">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 bg-bg">
      <div className="hidden lg:block">
        <Suspense>
          <Sidebar />
        </Suspense>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="lg:hidden">
          <TopBar />
        </div>
        <main
          className={`mx-auto w-full max-w-[480px] flex-1 px-4 pb-8 pt-4 lg:px-10 lg:pt-8 ${
            pathname === "/" ? "lg:max-w-[1180px]" : "lg:max-w-[960px]"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
