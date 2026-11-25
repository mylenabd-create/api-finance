"use client";

import { useRef, useState, useSyncExternalStore } from "react";
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
  Mic,
  Square,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { createClient } from "@/lib/supabase/client";
import { BASE_PATH } from "@/lib/basePath";
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

// Tipos mínimos da Web Speech API (não vêm no lib.dom do TypeScript).
interface ResultadoVoz {
  isFinal: boolean;
  0: { transcript: string };
}
interface ReconhecedorVoz {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ResultadoVoz> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type ConstrutorReconhecedor = new () => ReconhecedorVoz;

function obterReconhecedor(): ConstrutorReconhecedor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: ConstrutorReconhecedor;
    webkitSpeechRecognition?: ConstrutorReconhecedor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// suporte a voz não muda durante a sessão: nada para assinar
const semInscricao = () => () => {};

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

  // Reconhecimento de voz do próprio navegador (gratuito; Chrome/Android e
  // Safari/iPhone). O texto falado vai para a caixa e é enviado sozinho.
  const [ouvindo, setOuvindo] = useState(false);
  const vozDisponivel = useSyncExternalStore(
    semInscricao,
    () => Boolean(obterReconhecedor()),
    () => false
  );
  const reconhecedorRef = useRef<ReconhecedorVoz | null>(null);

  function alternarVoz() {
    if (ouvindo) {
      reconhecedorRef.current?.stop();
      return;
    }
    const Reconhecedor = obterReconhecedor();
    if (!Reconhecedor) return;
    const rec = new Reconhecedor();
    rec.lang = "pt-BR";
    rec.interimResults = true;
    rec.continuous = false;
    let finalTexto = "";
    rec.onresult = (e) => {
      let parcial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalTexto += r[0].transcript;
        else parcial += r[0].transcript;
      }
      setMensagem((finalTexto + parcial).trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setFeedback("Permita o uso do microfone para falar com a secretária.");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setFeedback("Não consegui ouvir. Tente de novo.");
      }
    };
    rec.onend = () => {
      setOuvindo(false);
      reconhecedorRef.current = null;
      if (finalTexto.trim()) enviarMensagem(finalTexto.trim());
    };
    reconhecedorRef.current = rec;
    setFeedback(null);
    setOuvindo(true);
    rec.start();
  }

  async function enviarMensagem(textoFalado?: string) {
    const texto = (textoFalado ?? mensagem).trim();
    if (!texto || enviando) return;
    setEnviando(true);
    setFeedback(null);
    try {
      const res = await fetch(`${BASE_PATH}/api/mensagem`, {
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
        const resultados: { ok: boolean; descricao: string }[] = data.resultados ?? [];
        const lancs: { descricao: string; valor?: number; area: string }[] = data.lancamentos ?? [];
        const anotados = resultados
          .map((r, i) => ({ ...r, l: lancs[i] }))
          .filter((r) => r.ok)
          .map((r) =>
            r.l?.valor != null && (r.l.area === "despesa" || r.l.area === "receita")
              ? `${r.descricao} ${r.l.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}${r.l.area === "receita" ? " (entrada)" : ""}`
              : r.descricao
          );
        const falhas = resultados.length - anotados.length;
        setFeedback(
          anotados.length > 0
            ? `Anotado: ${anotados.join(" · ")}${falhas > 0 ? ` (${falhas} não registrado)` : ""}`
            : "Não consegui registrar. Tente de novo."
        );
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

      <div className="mb-4.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[11.5px] font-medium uppercase tracking-[1.2px] text-text-dim">
            {dataFormatada()}
          </p>
          <h1 className="mt-1 font-display text-2xl text-text">
            {saudacao()}, {nomePessoa}
          </h1>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${BASE_PATH}/icons/cerne-marca-256.png`}
          alt="Cerne"
          width={36}
          height={36}
          className="mt-0.5 shrink-0 rounded-[10px]"
        />
      </div>

      <Card className="mb-1.5 flex items-center gap-2.5 px-3.5 py-3">
        <span className="lm-live inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-accent" />
        <input
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") enviarMensagem();
          }}
          placeholder={ouvindo ? "Pode falar, estou ouvindo..." : "Digite ou fale: gastei 30 de mercado"}
          disabled={enviando}
          className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-dim disabled:opacity-60"
        />
        {vozDisponivel && (
          <button
            onClick={alternarVoz}
            disabled={enviando}
            aria-label={ouvindo ? "Parar de ouvir" : "Falar"}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full disabled:opacity-40 ${
              ouvindo ? "lm-live bg-coral text-white" : "bg-accent-soft text-accent"
            }`}
          >
            {ouvindo ? <Square size={13} fill="currentColor" /> : <Mic size={16} />}
          </button>
        )}
        <button
          onClick={() => enviarMensagem()}
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
            style={{ background: `color-mix(in srgb, ${module.color} 12%, transparent)` }}
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
