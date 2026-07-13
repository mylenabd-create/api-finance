"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { BASE_PATH } from "@/lib/basePath";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export function ConectarGoogleAgenda({
  conectado,
  ultimaSincronizacao,
}: {
  conectado: boolean;
  ultimaSincronizacao: string | null;
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function conectar() {
    setErro(null);
    setCarregando(true);
    const supabase = createClient();

    const redirectTo = `${window.location.origin}${BASE_PATH}/auth/callback?next=${BASE_PATH}/agenda`;
    const options = {
      scopes: CALENDAR_SCOPE,
      redirectTo,
      queryParams: { access_type: "offline", prompt: "consent" },
    };

    // Se o Google já é a identidade de login, linkIdentity falha (já
    // vinculada) — nesse caso só refazemos o login pedindo o escopo extra.
    const { data: identidades } = await supabase.auth.getUserIdentities();
    const jaTemGoogle = identidades?.identities?.some((i) => i.provider === "google");

    const { error } = jaTemGoogle
      ? await supabase.auth.signInWithOAuth({ provider: "google", options })
      : await supabase.auth.linkIdentity({ provider: "google", options });

    if (error) {
      setErro(error.message);
      setCarregando(false);
    }
    // em caso de sucesso o navegador é redirecionado pro Google — não precisa fazer mais nada aqui
  }

  async function sincronizar() {
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/agenda/sincronizar-google`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha ao sincronizar.");
      } else {
        router.refresh();
      }
    } catch {
      setErro("Falha ao sincronizar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card className="flex items-center gap-3 p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
        <CalendarCheck2 size={16} className="text-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px]">Google Agenda</p>
        <p className="mt-0.5 text-[11px] text-text-dim">
          {conectado
            ? ultimaSincronizacao
              ? `Sincronizado em ${new Date(ultimaSincronizacao).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Conectado — ainda não sincronizado"
            : "Traga seus compromissos do Google Calendar pra cá"}
        </p>
        {erro && <p className="mt-1 text-[11px] text-coral">{erro}</p>}
      </div>
      <button
        onClick={conectado ? sincronizar : conectar}
        disabled={carregando}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-bg-panel-raised px-3 py-1.5 text-[12px] text-accent disabled:opacity-50"
      >
        {conectado && <RefreshCw size={12} className={carregando ? "animate-spin" : ""} />}
        {conectado ? "Sincronizar" : carregando ? "Conectando…" : "Conectar"}
      </button>
    </Card>
  );
}
