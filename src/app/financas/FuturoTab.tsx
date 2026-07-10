"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Plus, Repeat, Sparkles } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { formatBRL } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { LancamentoFuturo } from "./types";

const NOMES_MES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function tipoLabel(tipo: LancamentoFuturo["tipo"]) {
  if (tipo === "recorrente") return { label: "Recorrente", icon: Repeat };
  if (tipo === "parcelado") return { label: "Parcelado", icon: CalendarClock };
  return { label: "Projetado", icon: Sparkles };
}

function formatMesFim(dataFim: string | null) {
  if (!dataFim) return "contínuo";
  const d = new Date(dataFim + "T00:00:00");
  return `até ${NOMES_MES[d.getMonth()].toLowerCase()}/${String(d.getFullYear()).slice(2)}`;
}

export function FuturoTab({
  contaId,
  lancamentosFuturos,
}: {
  contaId: string;
  lancamentosFuturos: LancamentoFuturo[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<LancamentoFuturo["tipo"]>("recorrente");
  const [fluxo, setFluxo] = useState<LancamentoFuturo["fluxo"]>("despesa");
  const [saving, setSaving] = useState(false);

  // Projeção simples: para os próximos 5 meses, soma flat de lançamentos
  // recorrentes cujo período (data_inicio..data_fim) cobre aquele mês.
  const proximosMeses = useMemo(() => {
    const hoje = new Date();
    const meses: { mes: string; ano: number; mesIdx: number; receita: number; despesa: number }[] = [];
    for (let i = 1; i <= 5; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      meses.push({ mes: NOMES_MES[d.getMonth()], ano: d.getFullYear(), mesIdx: d.getMonth(), receita: 0, despesa: 0 });
    }

    for (const l of lancamentosFuturos) {
      if (l.tipo === "projetado") {
        // Projetado: soma inteira no mês de data_inicio, se cair no período.
        const inicio = new Date(l.data_inicio + "T00:00:00");
        const alvo = meses.find((m) => m.ano === inicio.getFullYear() && m.mesIdx === inicio.getMonth());
        if (alvo) {
          if (l.fluxo === "receita") alvo.receita += Number(l.valor);
          else alvo.despesa += Number(l.valor);
        }
        continue;
      }

      // Recorrente / parcelado: soma flat em cada mês dentro do intervalo
      // [data_inicio, data_fim ?? sempre].
      const inicio = new Date(l.data_inicio + "T00:00:00");
      const fim = l.data_fim ? new Date(l.data_fim + "T00:00:00") : null;
      for (const m of meses) {
        const inicioMes = new Date(m.ano, m.mesIdx, 1);
        const passouInicio = inicioMes >= new Date(inicio.getFullYear(), inicio.getMonth(), 1);
        const dentroFim = !fim || inicioMes <= new Date(fim.getFullYear(), fim.getMonth(), 1);
        if (passouInicio && dentroFim) {
          if (l.fluxo === "receita") m.receita += Number(l.valor);
          else m.despesa += Number(l.valor);
        }
      }
    }

    return meses;
  }, [lancamentosFuturos]);

  async function addLancamento() {
    const v = Number(valor.replace(",", "."));
    if (!descricao.trim() || !v || v <= 0) return;
    setSaving(true);
    await supabase.from("lancamento_futuro").insert({
      conta_id: contaId,
      descricao: descricao.trim(),
      valor: v,
      tipo,
      fluxo,
      data_inicio: new Date().toISOString().slice(0, 10),
    });
    setDescricao("");
    setValor("");
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="pt-3.5 pr-2.5 pb-2 pl-2.5">
        <p className="m-0 mb-1 ml-2 text-[12.5px] text-text-dim">Receita x despesa prevista por mês</p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={proximosMeses} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#232D39" vertical={false} />
            <XAxis dataKey="mes" stroke="#8C97A3" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#1E2732",
                border: "1px solid #2A3441",
                borderRadius: 8,
                color: "#EDEDE6",
                fontSize: 12,
              }}
              formatter={(v) => formatBRL(Number(v))}
            />
            <Bar dataKey="receita" fill="#5B9C93" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesa" fill="#D9765A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-0.5 flex gap-4 pl-2 text-[11px] text-text-dim">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: "#5B9C93" }} /> Receita
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: "#D9765A" }} /> Despesa
          </span>
        </div>
      </Card>

      <div>
        <p className="m-0 mb-2 ml-0.5 text-[12.5px] text-text-dim">Recorrentes, parcelados e projetados</p>
        <div className="flex flex-col gap-2">
          {lancamentosFuturos.map((l) => {
            const { label, icon: TipoIcon } = tipoLabel(l.tipo);
            const isReceita = l.fluxo === "receita";
            return (
              <Card key={l.id} className="flex items-center gap-3 p-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
                  style={{ background: isReceita ? "rgba(91,156,147,0.15)" : "rgba(217,118,90,0.15)" }}
                >
                  <TipoIcon size={14} color={isReceita ? "var(--teal)" : "var(--coral)"} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[13px]">{l.descricao}</p>
                  <p className="m-0 mt-0.5 text-[11px] text-text-dim">
                    {label} · {formatMesFim(l.data_fim)}
                  </p>
                </div>
                <span
                  className="font-mono text-[13px]"
                  style={{ color: isReceita ? "var(--teal)" : "var(--text)" }}
                >
                  {isReceita ? "+" : "-"}
                  {formatBRL(Number(l.valor))}
                </span>
              </Card>
            );
          })}
          {lancamentosFuturos.length === 0 && (
            <p className="text-xs text-text-dim">Nenhum lançamento futuro cadastrado.</p>
          )}
        </div>
      </div>

      <Card className="flex flex-col gap-2 p-3">
        <p className="m-0 text-[12px] text-text-dim">Adicionar lançamento futuro</p>
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição (ex: Assinatura Adobe)"
          className="w-full rounded-lg border border-line bg-bg-panel-raised px-2.5 py-2 text-[13px] text-text outline-none"
        />
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Valor"
          inputMode="decimal"
          className="font-mono w-full rounded-lg border border-line bg-bg-panel-raised px-2.5 py-2 text-[13px] text-text outline-none"
        />
        <div className="flex gap-2">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as LancamentoFuturo["tipo"])}
            className="w-1/2 rounded-lg border border-line bg-bg-panel-raised px-2.5 py-2 text-[13px] text-text outline-none"
          >
            <option value="recorrente">Recorrente</option>
            <option value="parcelado">Parcelado</option>
            <option value="projetado">Projetado</option>
          </select>
          <select
            value={fluxo}
            onChange={(e) => setFluxo(e.target.value as LancamentoFuturo["fluxo"])}
            className="w-1/2 rounded-lg border border-line bg-bg-panel-raised px-2.5 py-2 text-[13px] text-text outline-none"
          >
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
        </div>
        <button
          onClick={addLancamento}
          disabled={saving}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-accent py-2 text-[13px] font-medium text-bg disabled:opacity-50"
        >
          <Plus size={15} /> Adicionar
        </button>
      </Card>
    </div>
  );
}
