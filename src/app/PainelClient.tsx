"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Flame,
  Sparkles,
  BookOpen,
  Dumbbell,
  ListChecks,
  Calendar,
  Moon,
  Briefcase,
  Send,
  ChevronRight,
  X,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

export type ModuleData = {
  key: string;
  href: string;
  title: string;
  metric: string;
  sub: string;
  detail: string;
  progress: number | null;
  color: string;
  icon: keyof typeof moduleIcons;
};

const moduleIcons = {
  Wallet,
  Flame,
  Sparkles,
  BookOpen,
  Dumbbell,
  ListChecks,
  Calendar,
  Moon,
  Briefcase,
} satisfies Record<string, LucideIcon>;

const lembreteIcons: Record<Tables<"lembrete">["tipo"], LucideIcon> = {
  pagamento: CreditCard,
  habito: Flame,
  compromisso: Calendar,
  tarefa: ListChecks,
};

const lembreteCores: Record<Tables<"lembrete">["tipo"], string> = {
  pagamento: "var(--coral)",
  habito: "var(--purple)",
  compromisso: "var(--accent)",
  tarefa: "var(--text-dim)",
};

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function dataFormatada(): string {
  const formatado = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return formatado.charAt(0).toUpperCase() + formatado.slice(1);
}

export function PainelClient({
  nomePessoa,
  lembretes,
  modules,
}: {
  nomePessoa: string;
  lembretes: Tables<"lembrete">[];
  modules: ModuleData[];
}) {
  const router = useRouter();
  const [dispensados, setDispensados] = useState<Set<string>>(new Set());
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function dispensarLembrete(id: string) {
    setDispensados((prev) => new Set(prev).add(id));
    const supabase = createClient();
    await supabase.from("lembrete").update({ dispensado: true }).eq("id", id);
    router.refresh();
  }

  async function enviarMensagem() {
    const texto = mensagem.trim();
    if (!texto || enviando) return;
    setEnviando(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/mensagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error ?? "Não consegui processar essa mensagem.");
      } else if (data.aviso) {
        setFeedback(data.aviso);
      } else {
        const ok = (data.resultados ?? []).filter((r: { ok: boolean }) => r.ok).length;
        const total = (data.resultados ?? []).length;
        setFeedback(`${ok}/${total} lançamento(s) registrado(s).`);
        setMensagem("");
        router.refresh();
      }
    } catch {
      setFeedback("Falha ao falar com a secretária. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  const lembretesVisiveis = lembretes.filter((l) => !dispensados.has(l.id));

  return (
    <div>
      {lembretesVisiveis.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {lembretesVisiveis.map((l) => {
            const Icon = lembreteIcons[l.tipo];
            const cor = lembreteCores[l.tipo];
            return (
              <Card
                key={l.id}
                className="flex items-center gap-2.5 px-3 py-2.5"
                style={{ borderLeft: `2px solid ${cor}` }}
              >
                <Icon size={14} color={cor} className="shrink-0" />
                <p className="m-0 flex-1 text-[12.5px] text-text">{l.texto}</p>
                <button
                  onClick={() => dispensarLembrete(l.id)}
                  className="shrink-0 p-0.5 text-text-dim"
                  aria-label="Dispensar lembrete"
                >
                  <X size={14} />
                </button>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mb-4.5">
        <p className="m-0 font-mono text-[11.5px] uppercase tracking-[1.2px] text-text-dim">
          {dataFormatada()}
        </p>
        <h1 className="mt-1 font-display text-2xl font-medium text-text">
          {saudacao()}, {nomePessoa}
        </h1>
      </div>

      <Card className="mb-1.5 flex items-center gap-2.5 px-3.5 py-3">
        <span className="lm-live inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-accent" />
        <input
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") enviarMensagem();
          }}
          placeholder="Fale com sua secretária..."
          disabled={enviando}
          className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-dim disabled:opacity-60"
        />
        <button
          onClick={enviarMensagem}
          disabled={enviando || !mensagem.trim()}
          aria-label="Enviar"
          className="shrink-0 disabled:opacity-40"
        >
          <Send size={16} className="text-accent" />
        </button>
      </Card>
      {feedback && (
        <p className="mb-3.5 px-1 text-[12px] text-text-dim">{feedback}</p>
      )}
      {!feedback && <div className="mb-5" />}

      <div className="grid grid-cols-2 gap-3">
        {modules.map((m) => (
          <ModuleCard key={m.key} module={m} />
        ))}
      </div>

      <p className="my-5 text-center text-[11.5px] text-text-dim">
        Toque em um card pra ver os detalhes
      </p>
    </div>
  );
}

function ModuleCard({ module }: { module: ModuleData }) {
  const Icon = moduleIcons[module.icon];
  return (
    <Link href={module.href}>
      <Card className="h-full p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <div
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px]"
            style={{ background: `${module.color}22` }}
          >
            <Icon size={15} color={module.color} />
          </div>
          <ChevronRight size={14} className="text-text-dim" />
        </div>
        <p className="m-0 text-xs text-text-dim">{module.title}</p>
        <p className="mt-0.5 font-mono text-[19px] font-medium text-text">{module.metric}</p>
        <p className="mb-2 mt-0.5 truncate text-[11.5px] text-text-dim">{module.detail}</p>
        {typeof module.progress === "number" && (
          <ProgressBar progress={module.progress} color={module.color} height={4} />
        )}
      </Card>
    </Link>
  );
}
