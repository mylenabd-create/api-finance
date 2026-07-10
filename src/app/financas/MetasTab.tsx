"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatBRL } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { iconeCategoria } from "./icons";
import type { MetaComCategoria } from "./types";

function metaValorAlvo(m: MetaComCategoria, totalReceita: number) {
  return m.tipo === "percentual" ? (totalReceita * Number(m.valor)) / 100 : Number(m.valor);
}

export function MetasTab({
  contaId,
  metas,
  totalReceita,
  mesReferencia,
}: {
  contaId: string;
  metas: MetaComCategoria[];
  totalReceita: number;
  mesReferencia: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [creating, setCreating] = useState(false);

  // Estado local de edição para inputs (evita disparar update a cada tecla).
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [valores, setValores] = useState<Record<string, string>>({});

  const totalMetas = metas.reduce((s, m) => s + metaValorAlvo(m, totalReceita), 0);

  async function updateNomeCategoria(categoriaId: string, nome: string) {
    await supabase.from("categoria").update({ nome }).eq("id", categoriaId);
    router.refresh();
  }

  async function updateMetaTipo(metaId: string, tipo: "percentual" | "valor") {
    await supabase.from("meta").update({ tipo }).eq("id", metaId);
    router.refresh();
  }

  async function updateMetaValor(metaId: string, valor: number) {
    await supabase.from("meta").update({ valor }).eq("id", metaId);
    router.refresh();
  }

  async function addArea() {
    if (creating) return;
    setCreating(true);
    const { data: categoria } = await supabase
      .from("categoria")
      .insert({ conta_id: contaId, nome: "Nova área", cor: "#8C97A3" })
      .select("id")
      .single();
    if (categoria) {
      await supabase.from("meta").insert({
        conta_id: contaId,
        categoria_id: categoria.id,
        tipo: "valor",
        valor: 0,
        mes_referencia: mesReferencia,
      });
    }
    setCreating(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <p className="m-0 text-xs text-text-dim">Total planejado</p>
        <p className="font-mono m-0 mt-1 mb-0.5 text-2xl font-medium">{formatBRL(totalMetas)}</p>
        <p className="m-0 text-[11.5px] text-text-dim">
          {totalReceita > 0
            ? `${Math.round((totalMetas / totalReceita) * 100)}% da sua receita mensal alocada em metas`
            : "defina receitas para calcular o percentual alocado"}
        </p>
      </Card>

      <div>
        <p className="m-0 mb-2 ml-0.5 text-[12.5px] text-text-dim">Defina quanto quer gastar em cada área</p>
        <div className="flex flex-col gap-2.5">
          {metas.map((m) => {
            const cor = m.categoria?.cor ?? "#8C97A3";
            const Icon = iconeCategoria(m.categoria?.icone ?? m.categoria?.nome);
            const goal = metaValorAlvo(m, totalReceita);
            const nomeAtual = nomes[m.id] ?? m.categoria?.nome ?? "";
            const valorAtual = valores[m.id] ?? String(m.valor);
            return (
              <Card key={m.id} className="p-3">
                <div className="mb-2.5 flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${cor}22` }}
                  >
                    <Icon size={14} color={cor} />
                  </div>
                  <input
                    value={nomeAtual}
                    onChange={(e) => setNomes((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    onBlur={(e) => {
                      if (m.categoria_id && e.target.value.trim()) {
                        updateNomeCategoria(m.categoria_id, e.target.value.trim());
                      }
                    }}
                    className="flex-1 bg-transparent text-[13px] text-text outline-none"
                  />
                  <span className="font-mono text-xs text-text-dim">= {formatBRL(goal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex overflow-hidden rounded-lg border border-line">
                    <button
                      onClick={() => updateMetaTipo(m.id, "percentual")}
                      className={`px-2.5 py-1.5 text-[11px] ${
                        m.tipo === "percentual" ? "bg-accent-soft text-accent" : "text-text-dim"
                      }`}
                    >
                      %
                    </button>
                    <button
                      onClick={() => updateMetaTipo(m.id, "valor")}
                      className={`border-l border-line px-2.5 py-1.5 text-[11px] ${
                        m.tipo === "valor" ? "bg-accent-soft text-accent" : "text-text-dim"
                      }`}
                    >
                      R$
                    </button>
                  </div>
                  <input
                    type="number"
                    value={valorAtual}
                    onChange={(e) => setValores((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    onBlur={(e) => {
                      const n = Number(e.target.value);
                      if (!Number.isNaN(n)) updateMetaValor(m.id, n);
                    }}
                    className="font-mono w-full rounded-lg border border-line bg-bg-panel-raised px-2 py-1.5 text-[12.5px] text-text outline-none"
                  />
                </div>
              </Card>
            );
          })}
          {metas.length === 0 && (
            <p className="text-xs text-text-dim">Nenhuma meta definida para este mês ainda.</p>
          )}
        </div>
      </div>

      <button
        onClick={addArea}
        disabled={creating}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed p-3 text-[13px] text-accent disabled:opacity-50"
        style={{ borderColor: "rgba(201,161,94,0.4)" }}
      >
        <Plus size={15} /> Adicionar área
      </button>
    </div>
  );
}
