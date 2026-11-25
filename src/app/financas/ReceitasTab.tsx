"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpCircle, MinusCircle, Plus, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { BotaoApagar } from "@/components/ui/BotaoApagar";
import { formatBRL } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { Pessoa, ReceitaComPessoa } from "./types";

export function ReceitasTab({
  contaId,
  pessoas,
  receitas,
  totalDespesas,
}: {
  contaId: string;
  pessoas: Pessoa[];
  receitas: ReceitaComPessoa[];
  totalDespesas: number;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [fonte, setFonte] = useState("");
  const [valor, setValor] = useState("");
  const [pessoaId, setPessoaId] = useState(pessoas[0]?.id ?? "");
  const [recorrente, setRecorrente] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalReceita = receitas.reduce((s, r) => s + Number(r.valor), 0);
  const saldo = totalReceita - totalDespesas;

  async function addReceita() {
    const v = Number(valor.replace(",", "."));
    if (!fonte.trim() || !v || v <= 0) return;
    setSaving(true);
    await supabase.from("receita").insert({
      conta_id: contaId,
      fonte: fonte.trim(),
      valor: v,
      pessoa_id: pessoaId || null,
      recorrente,
      data: new Date().toISOString().slice(0, 10),
    });
    setFonte("");
    setValor("");
    setRecorrente(false);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-[18px]">
        <p className="m-0 text-xs text-text-dim">Total de receitas no mês</p>
        <p className="font-mono m-0 mt-1 mb-0.5 text-[28px] font-medium" style={{ color: "var(--teal)" }}>
          {formatBRL(totalReceita)}
        </p>
        <p className="m-0 text-xs text-text-dim">
          de {receitas.length} {receitas.length === 1 ? "fonte" : "fontes"} diferentes
        </p>
      </Card>

      <Card className="flex items-center gap-3 p-4">
        {saldo >= 0 ? (
          <ArrowUpCircle size={20} color="var(--teal)" />
        ) : (
          <MinusCircle size={20} color="var(--coral)" />
        )}
        <div>
          <p className="m-0 text-xs text-text-dim">Saldo do mês (receita − despesa)</p>
          <p
            className="font-mono m-0 mt-0.5 text-lg font-medium"
            style={{ color: saldo >= 0 ? "var(--teal)" : "var(--coral)" }}
          >
            {saldo >= 0 ? "+" : ""}
            {formatBRL(saldo)}
          </p>
        </div>
      </Card>

      <div>
        <p className="m-0 mb-2 ml-0.5 text-[12.5px] text-text-dim">Fontes de receita</p>
        <div className="flex flex-col gap-2">
          {receitas.map((r) => {
            const pct = totalReceita > 0 ? Math.round((Number(r.valor) / totalReceita) * 100) : 0;
            return (
              <Card key={r.id} className="flex items-center gap-3 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-accent-soft">
                  <Wallet size={15} color="var(--accent)" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-1.5">
                      {r.fonte} {r.pessoa && <Avatar nome={r.pessoa.nome} cor={r.pessoa.cor} small />}
                    </span>
                    <span className="font-mono">{formatBRL(Number(r.valor))}</span>
                  </div>
                  <p className="m-0 mt-0.5 text-[11px] text-text-dim">
                    {r.recorrente ? "Recorrente" : "Pontual"} · {pct}% do total
                  </p>
                </div>
                <BotaoApagar
                  rotulo="Apagar receita"
                  onConfirmar={async () => {
                    await supabase.from("receita").delete().eq("id", r.id);
                    router.refresh();
                  }}
                />
              </Card>
            );
          })}
          {receitas.length === 0 && <p className="text-xs text-text-dim">Nenhuma receita registrada neste mês.</p>}
        </div>
      </div>

      <Card className="flex flex-col gap-2 p-3">
        <p className="m-0 text-[12px] text-text-dim">Adicionar receita</p>
        <input
          value={fonte}
          onChange={(e) => setFonte(e.target.value)}
          placeholder="Fonte (ex: Pró-labore)"
          className="w-full rounded-lg border border-line bg-bg-panel-raised px-2.5 py-2 text-[13px] text-text outline-none"
        />
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Valor"
          inputMode="decimal"
          className="font-mono w-full rounded-lg border border-line bg-bg-panel-raised px-2.5 py-2 text-[13px] text-text outline-none"
        />
        <div className="flex items-center gap-2">
          <select
            value={pessoaId}
            onChange={(e) => setPessoaId(e.target.value)}
            className="w-1/2 rounded-lg border border-line bg-bg-panel-raised px-2.5 py-2 text-[13px] text-text outline-none"
          >
            {pessoas.length === 0 && <option value="">Sem pessoa</option>}
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <label className="flex w-1/2 items-center justify-center gap-1.5 rounded-lg border border-line px-2.5 py-2 text-[12px] text-text-dim">
            <input
              type="checkbox"
              checked={recorrente}
              onChange={(e) => setRecorrente(e.target.checked)}
            />
            Recorrente
          </label>
        </div>
        <button
          onClick={addReceita}
          disabled={saving}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-accent py-2 text-[13px] font-medium text-on-accent disabled:opacity-50"
        >
          <Plus size={15} /> Adicionar
        </button>
      </Card>
    </div>
  );
}
