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
  Check,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { createClient } from "@/lib/supabase/client";
import { BASE_PATH } from "@/lib/basePath";
import type { Tables } from "@/lib/database.types";
import type { FraseDoDia } from "@/lib/fraseDoDia";
import { BalancoMes } from "@/components/BalancoMes";

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

type ItemPrevia = {
  area: string;
  descricao: string;
  valor?: number;
  categoria?: string;
  valorTexto: string;
  [campo: string]: unknown;
};

const ROTULO_AREA: Record<string, string> = {
  despesa: "Gasto",
  receita: "Entrada",
  habito: "Hábito",
  tarefa: "Tarefa",
  compromisso: "Agenda",
  leitura: "Leitura",
  espiritual: "Espiritual",
  treino: "Treino",
  sono: "Sono",
  bioimpedancia: "Bioimpedância",
};

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
  frase,
  balanco,
}: {
  nomePessoa: string;
  lembretes: Tables<"lembrete">[];
  modules: ModuleData[];
  frase: FraseDoDia;
  balanco: { entrou: number; saiu: number; saldo: number; meta: number };
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
  // Safari/iPhone). O texto falado vai para a caixa para a pessoa conferir.
  const [ouvindo, setOuvindo] = useState(false);
  const vozDisponivel = useSyncExternalStore(
    semInscricao,
    () => Boolean(obterReconhecedor()),
    () => false
  );
  const reconhecedorRef = useRef<ReconhecedorVoz | null>(null);
  const usouVozRef = useRef(false);
  const [previa, setPrevia] = useState<ItemPrevia[] | null>(null);

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
    // Remonta a frase inteira a cada evento (em vez de ir somando pedaços),
    // porque alguns celulares reenviam trechos já reconhecidos e isso
    // duplicava números ("30" virava "1030").
    rec.onresult = (e) => {
      const frase = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      setMensagem(frase);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setFeedback("Permita o uso do microfone para falar com a secretária.");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setFeedback("Não consegui ouvir. Tente de novo.");
      }
    };
    // Ao terminar de ouvir, o texto fica na caixa para a pessoa conferir;
    // nada é enviado sem ela tocar em enviar e depois confirmar a prévia.
    rec.onend = () => {
      setOuvindo(false);
      reconhecedorRef.current = null;
      usouVozRef.current = true;
    };
    reconhecedorRef.current = rec;
    setFeedback(null);
    setOuvindo(true);
    rec.start();
  }

  // Passo 1: pede ao servidor só a interpretação (prévia), sem gravar nada.
  async function enviarMensagem() {
    const texto = mensagem.trim();
    if (!texto || enviando) return;
    setEnviando(true);
    setFeedback(null);
    setPrevia(null);
    try {
      const res = await fetch(`${BASE_PATH}/api/mensagem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, previa: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error ?? "Não consegui processar essa mensagem.");
      } else if (data.aviso || !data.lancamentos?.length) {
        setFeedback(data.aviso ?? "Não identifiquei nenhum lançamento nessa mensagem.");
      } else {
        setPrevia(
          (data.lancamentos as ItemPrevia[]).map((l) => ({
            ...l,
            valorTexto: l.valor != null ? String(l.valor).replace(".", ",") : "",
          }))
        );
      }
    } catch {
      setFeedback("Falha ao falar com a secretária. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  // Passo 2: grava exatamente o que a pessoa revisou e confirmou.
  async function confirmarPrevia() {
    if (!previa || enviando) return;
    const aprovados = previa.map(({ valorTexto, ...l }) => {
      const n = Number(valorTexto.replace(/\./g, "").replace(",", "."));
      return { ...l, valor: valorTexto.trim() && Number.isFinite(n) ? n : l.valor };
    });
    if (aprovados.some((l) => (l.area === "despesa" || l.area === "receita") && !(l.valor! > 0))) {
      setFeedback("Confira os valores antes de confirmar.");
      return;
    }
    setEnviando(true);
    setFeedback(null);
    try {
      const res = await fetch(`${BASE_PATH}/api/mensagem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmar: aprovados,
          origem: usouVozRef.current ? "ia_audio" : "ia_texto",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error ?? "Não consegui registrar.");
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
        setPrevia(null);
        usouVozRef.current = false;
        router.refresh();
      }
    } catch {
      setFeedback("Falha ao falar com a secretária. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  function atualizarItem(i: number, mudanca: Partial<ItemPrevia>) {
    setPrevia((p) => (p ? p.map((l, j) => (j === i ? { ...l, ...mudanca } : l)) : p));
  }

  function removerItem(i: number) {
    setPrevia((p) => {
      const novo = p ? p.filter((_, j) => j !== i) : p;
      return novo && novo.length > 0 ? novo : null;
    });
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

      {/* Computador: duas colunas (saudação + secretária | balanço). Celular: uma coluna. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
      <div className="min-w-0">
      <div className="mb-4.5">
        <p className="m-0 text-[11.5px] font-medium uppercase tracking-[1.2px] text-text-dim">
          {dataFormatada()}
        </p>
        <h1 className="mt-1 font-display text-2xl text-text">
          {saudacao()}, {nomePessoa}
        </h1>
      </div>

      {/* Frase do dia: um dos momentos especiais em que o gradiente da marca aparece */}
      <div className="relative mb-4 overflow-hidden rounded-2xl bg-deep p-4 text-white">
        <div className="bg-brand-gradient absolute inset-y-0 left-0 w-1.5" aria-hidden="true" />
        <div
          className="bg-brand-gradient pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-2xl"
          aria-hidden="true"
        />
        <p className="relative flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[1.4px] text-white/70">
          <Sparkles size={12} /> Se liga
        </p>
        <p className="relative mt-1.5 text-[15.5px] font-semibold leading-snug">{frase.texto}</p>
        <p className="relative mt-2 text-[11px] italic text-white/60">{frase.fonte}</p>
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

      {previa && (
        <Card className="mb-2 mt-2 p-3.5" style={{ borderColor: "var(--accent)" }}>
          <p className="text-[12px] font-semibold uppercase tracking-[1px] text-text-dim">
            Confira antes de salvar
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {previa.map((l, i) => {
              const dinheiro = l.area === "despesa" || l.area === "receita";
              return (
                <li key={i} className="flex items-center gap-2 rounded-xl bg-bg-panel-raised px-2.5 py-2">
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                      l.area === "receita" ? "bg-teal/15 text-teal" : "bg-accent-soft text-accent"
                    }`}
                  >
                    {ROTULO_AREA[l.area] ?? l.area}
                  </span>
                  <input
                    value={l.descricao}
                    onChange={(e) => atualizarItem(i, { descricao: e.target.value })}
                    aria-label="Descrição"
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none"
                  />
                  {dinheiro && (
                    <label className="flex shrink-0 items-center gap-1 rounded-lg border border-line bg-bg-panel px-2 py-1">
                      <span className="text-[11px] text-text-dim">R$</span>
                      <input
                        value={l.valorTexto}
                        onChange={(e) => atualizarItem(i, { valorTexto: e.target.value })}
                        inputMode="decimal"
                        aria-label="Valor"
                        className="w-[64px] bg-transparent text-right font-mono text-[13px] text-text outline-none"
                      />
                    </label>
                  )}
                  <button
                    onClick={() => removerItem(i)}
                    aria-label="Remover da prévia"
                    className="shrink-0 p-0.5 text-text-dim"
                  >
                    <X size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
          {previa.some((l) => l.categoria) && (
            <p className="mt-2 text-[11.5px] text-text-dim">
              Categoria:{" "}
              {[...new Set(previa.map((l) => l.categoria).filter(Boolean))].join(", ")}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setPrevia(null)}
              disabled={enviando}
              className="flex-1 rounded-xl border border-line bg-bg-panel py-2.5 text-[13px] font-medium text-text"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarPrevia}
              disabled={enviando}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-[13px] font-semibold text-on-accent disabled:opacity-60"
            >
              <Check size={15} /> Confirmar
            </button>
          </div>
        </Card>
      )}
      {feedback && (
        <p className="mb-3.5 px-1 text-[12px] text-text-dim">{feedback}</p>
      )}
      {!feedback && <div className="mb-5" />}
      </div>

      <div className="mb-5 lg:mb-0">
        <BalancoMes entrou={balanco.entrou} saiu={balanco.saiu} href="/financas" />
      </div>
      </div>

      <div className="mt-1 flex items-center justify-between lg:mt-8">
        <h2 className="text-[13px] font-semibold uppercase tracking-[1.2px] text-text-dim">Suas áreas</h2>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {modules.map((m) => (
          <ModuleCard key={m.key} module={m} />
        ))}
      </div>

      <p className="my-5 text-center text-[11.5px] text-text-dim lg:hidden">
        Toque em um card pra ver os detalhes
      </p>
    </div>
  );
}

function ModuleCard({ module }: { module: ModuleData }) {
  const Icon = moduleIcons[module.icon];
  return (
    <Link href={module.href} className="group">
      <Card className="h-full p-3.5 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-accent/40 group-hover:shadow-[0_10px_24px_rgba(49,0,79,0.10)] lg:p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <div
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] transition-transform duration-200 group-hover:scale-110 lg:h-9 lg:w-9"
            style={{ background: `color-mix(in srgb, ${module.color} 12%, transparent)` }}
          >
            <Icon size={15} color={module.color} />
          </div>
          <ChevronRight size={14} className="text-text-dim transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent" />
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
