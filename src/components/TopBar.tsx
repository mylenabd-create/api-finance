"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, ShieldCheck } from "lucide-react";
import { BASE_PATH } from "@/lib/basePath";
import { createClient } from "@/lib/supabase/client";
import { GRUPOS, grupoAtivo } from "@/components/navegacao";

// Menu do topo para celular: marca + botão de menu completo, e logo abaixo
// as áreas principais sempre à vista (sem barra no rodapé).
export function TopBar() {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function sair() {
    await createClient().auth.signOut();
    setAberto(false);
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-deep px-4 pb-2 pt-[max(10px,env(safe-area-inset-top))] text-white shadow-[0_6px_20px_rgba(49,0,79,0.18)]">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="Cerne, início">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${BASE_PATH}/icons/cerne-marca-256.png`} alt="" width={30} height={30} className="rounded-[9px]" />
            <span className="text-[15px] font-extrabold tracking-[0.14em]">CERNE</span>
          </Link>
          <button
            onClick={() => setAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={aberto}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
          >
            <Menu size={18} />
          </button>
        </div>

        <nav className="mt-2 flex justify-between gap-1">
          {GRUPOS.map(({ curto, href, icon: Icon }) => {
            const ativo = grupoAtivo(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10.5px] transition-colors ${
                  ativo ? "bg-white/12 font-semibold text-white" : "text-white/60"
                }`}
              >
                <Icon size={17} strokeWidth={ativo ? 2.4 : 2} />
                {curto}
                {ativo && <span className="bg-brand-gradient absolute bottom-0 h-[3px] w-5 rounded-full" />}
              </Link>
            );
          })}
        </nav>
      </header>

      {aberto && (
        <div className="fixed inset-0 z-50 flex justify-center" role="dialog" aria-modal="true">
          <button
            aria-label="Fechar menu"
            onClick={() => setAberto(false)}
            className="absolute inset-0 bg-deep/40 backdrop-blur-[2px]"
          />
          <nav className="relative flex max-h-full w-full max-w-[480px] flex-col overflow-y-auto rounded-b-3xl bg-bg-panel px-4 pb-5 pt-[max(12px,env(safe-area-inset-top))] shadow-[0_12px_40px_rgba(49,0,79,0.25)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-[1.4px] text-text-dim">Menu</span>
              <button
                onClick={() => setAberto(false)}
                aria-label="Fechar menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-deep active:bg-bg-panel-raised"
              >
                <X size={20} />
              </button>
            </div>

            <ul className="flex flex-col gap-1.5">
              {GRUPOS.map(({ titulo, href, icon: Icon, atalhos }) => {
                const ativo = grupoAtivo(href, pathname);
                return (
                  <li key={href} className="rounded-2xl border border-line p-2.5">
                    <Link href={href} onClick={() => setAberto(false)} className="flex items-center gap-2.5">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${
                          ativo ? "bg-accent text-on-accent" : "bg-accent-soft text-accent"
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="text-[14px] font-semibold text-text">{titulo}</span>
                    </Link>
                    {atalhos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 pl-[42px]">
                        {atalhos.map((a) => (
                          <Link
                            key={a.aba}
                            href={`${href}?aba=${a.aba}`}
                            onClick={() => setAberto(false)}
                            className="rounded-full bg-bg-panel-raised px-3 py-1 text-[12px] font-medium text-deep active:bg-accent-soft"
                          >
                            {a.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <Link
                href="/privacidade"
                onClick={() => setAberto(false)}
                className="flex items-center gap-1.5 text-[12.5px] text-text-dim"
              >
                <ShieldCheck size={14} /> Privacidade
              </Link>
              <button
                onClick={sair}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-coral active:bg-bg-panel-raised"
              >
                <LogOut size={14} /> Sair
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
