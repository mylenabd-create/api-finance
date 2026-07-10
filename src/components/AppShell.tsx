"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/login");

  return (
    <div className="flex flex-1 justify-center bg-bg">
      <div className="flex w-full max-w-[480px] flex-1 flex-col">
        <main className="flex-1 overflow-y-auto px-4 pb-4 pt-6">
          {children}
        </main>
        {!isAuthRoute && <BottomNav />}
      </div>
    </div>
  );
}
