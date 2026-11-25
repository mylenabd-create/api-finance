"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { BASE_PATH } from "@/lib/basePath";
import { createClient } from "@/lib/supabase/client";
import { GRUPOS, grupoAtivo } from "@/components/navegacao";

// Menu lateral fixo para telas grandes (computador). Roxo profundo, como
// pede o Manual CERNE para navegação.
export function Sidebar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const abaAtual = params.get("aba");

  async function sair() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col bg-deep px-4 py-6 text-white">
      <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${BASE_PATH}/icons/cerne-marca-256.png`} alt="" width={36} height={36} className="rounded-[10px]" />
        <span className="text-[17px] font-extrabold tracking-[0.16em]">CERNE</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {GRUPOS.map(({ titulo, href, icon: Icon, atalhos }) => {
          const ativo = grupoAtivo(href, pathname);
          return (
            <div key={href}>
              <Link
                href={href}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors ${
                  ativo ? "bg-white/12 font-semibold text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
                }`}
              >
                {ativo && <span className="bg-brand-gradient absolute inset-y-2 left-0 w-1 rounded-full" />}
                <Icon size={18} strokeWidth={ativo ? 2.4 : 2} />
                {titulo}
              </Link>
              {ativo && atalhos.length > 0 && (
                <div className="mb-1 ml-[42px] mt-1 flex flex-col gap-0.5">
                  {atalhos.map((a, i) => {
                    const sel = abaAtual ? abaAtual === a.aba : i === 0;
                    return (
                      <Link
                        key={a.aba}
                        href={`${href}?aba=${a.aba}`}
                        className={`rounded-lg px-2.5 py-1.5 text-[13px] transition-colors ${
                          sel ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                        }`}
                      >
                        {a.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-4">
        <Link
          href="/privacidade"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-white/60 hover:text-white"
        >
          <ShieldCheck size={16} /> Privacidade
        </Link>
        <button
          onClick={sair}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] text-white/60 hover:bg-white/8 hover:text-white"
        >
          <LogOut size={16} /> Sair
        </button>
      </div>
    </aside>
  );
}
