"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import { formatBRL } from "@/lib/format";
import type { Tables } from "@/lib/database.types";

type Props = {
  contaId: string;
  cartao: Tables<"cartao">;
  faturaAtual: Tables<"fatura"> | null;
  transacoesIniciais: Tables<"transacao">[];
  categorias: Tables<"categoria">[];
  pessoas: Tables<"pessoa">[];
};

function formatDataCurta(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function formatDataExtensa(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

export function CartaoClient({
  contaId,
  cartao,
  faturaAtual,
  transacoesIniciais,
  categorias,
  pessoas,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [transacoes, setTransacoes] = useState(transacoesIniciais);
  const [showForm, setShowForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [pessoaId, setPessoaId] = useState(pessoas[0]?.id ?? "");

  const categoriaPorId = useMemo(() => {
    const map = new Map(categorias.map((c) => [c.id, c]));
    return map;
  }, [categorias]);

  const pessoaPorId = useMemo(() => {
    const map = new Map(pessoas.map((p) => [p.id, p]));
    return map;
  }, [pessoas]);

  const totalFatura = useMemo(
    () => transacoes.reduce((acc, t) => acc + Number(t.valor), 0),
    [transacoes]
  );

  const porCategoria = useMemo(() => {
    const acc = new Map<string, number>();
    for (const t of transacoes) {
      const key = t.categoria_id ?? "sem-categoria";
      acc.set(key, (acc.get(key) ?? 0) + Number(t.valor));
    }
    return Array.from(acc.entries())
      .map(([id, valor]) => ({
        id,
        nome: categoriaPorId.get(id)?.nome ?? "Sem categoria",
        cor: categoriaPorId.get(id)?.cor ?? "#8C97A3",
        valor,
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [transacoes, categoriaPorId]);

  const usoPercentual =
    cartao.limite_total > 0 ? totalFatura / cartao.limite_total : 0;

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!faturaAtual) return;
    setErro(null);

    const valorNum = Number(valor.replace(",", "."));
    if (!descricao.trim() || !valorNum || valorNum <= 0) {
      setErro("Preencha descrição e um valor válido.");
      return;
    }

    setSalvando(true);
    const { data, error } = await supabase
      .from("transacao")
      .insert({
        conta_id: contaId,
        descricao: descricao.trim(),
        valor: valorNum,
        data: new Date().toISOString().slice(0, 10),
        categoria_id: categoriaId || null,
        pessoa_id: pessoaId || null,
        fatura_id: faturaAtual.id,
        origem: "manual",
      })
      .select("*")
      .single();
    setSalvando(false);

    if (error || !data) {
      setErro("Não foi possível adicionar o item. Tente novamente.");
      return;
    }

    setTransacoes((prev) => [data as Tables<"transacao">, ...prev]);
    setDescricao("");
    setValor("");
    setShowForm(false);
    router.refresh();
  }

  async function handleRemover(id: string) {
    setRemovendoId(id);
    const { error } = await supabase.from("transacao").delete().eq("id", id);
    setRemovendoId(null);

    if (error) {
      setErro("Não foi possível remover o item.");
      return;
    }

    setTransacoes((prev) => prev.filter((t) => t.id !== id));
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-1 pb-1 pt-1">
        <Link
          href="/financas"
          className="flex h-8 w-8 items-center justify-center rounded-full text-text active:bg-bg-panel-raised"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-display text-[18px] font-medium">
            {cartao.banco}
          </h1>
          <p className="text-[11.5px] text-text-dim">
            {cartao.bandeira} · final {cartao.final}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 py-3">
        {/* Card visual */}
        <Card className="p-[18px]">
          <div className="mb-[18px] flex items-center justify-between">
            <CreditCard size={22} className="text-accent" />
            <span className="text-xs text-text-dim">{cartao.bandeira}</span>
          </div>
          <p className="font-mono text-[15px] tracking-[2px] text-text-dim">
            •••• •••• •••• {cartao.final}
          </p>
        </Card>

        {!faturaAtual ? (
          <Card className="flex flex-col items-center gap-2 p-8 text-center">
            <Calendar size={28} className="text-text-dim" />
            <p className="text-sm text-text">Nenhuma fatura ainda</p>
            <p className="text-[12.5px] text-text-dim">
              Este cartão ainda não tem faturas registradas. Assim que houver
              uma fatura, os itens aparecerão aqui.
            </p>
          </Card>
        ) : (
          <>
            {/* Fatura atual */}
            <Card className="p-[18px]">
              <p className="text-xs text-text-dim">Fatura atual</p>
              <p className="my-1 font-mono text-[26px] font-medium">
                {formatBRL(totalFatura)}
              </p>
              <div className="flex flex-wrap gap-4 text-[11.5px] text-text-dim">
                <span className="flex items-center gap-[5px]">
                  <Calendar size={12} /> Fecha{" "}
                  {formatDataExtensa(faturaAtual.fechamento)}
                </span>
                <span>Vence {formatDataExtensa(faturaAtual.vencimento)}</span>
              </div>
            </Card>

            {/* Limite */}
            <Card className="p-4">
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-text-dim">Limite usado</span>
                <span className="font-mono">
                  {formatBRL(totalFatura)} de {formatBRL(cartao.limite_total)}
                </span>
              </div>
              <ProgressBar progress={usoPercentual} height={6} />
            </Card>

            {/* Donut por categoria */}
            {porCategoria.length > 0 && (
              <Card className="p-4">
                <p className="mb-2 ml-0.5 text-[12.5px] text-text-dim">
                  Por categoria nesta fatura
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-[130px] w-[130px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={porCategoria}
                          dataKey="valor"
                          nameKey="nome"
                          innerRadius={40}
                          outerRadius={62}
                          paddingAngle={2}
                        >
                          {porCategoria.map((c) => (
                            <Cell
                              key={c.id}
                              fill={c.cor}
                              stroke="var(--bg-panel)"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-1 flex-col gap-[7px]">
                    {porCategoria.map((c) => {
                      const pct = Math.round((c.valor / totalFatura) * 100);
                      return (
                        <div
                          key={c.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="flex items-center gap-1.5 text-text-dim">
                            <span
                              className="inline-block h-[7px] w-[7px] rounded-full"
                              style={{ background: c.cor }}
                            />
                            {c.nome}
                          </span>
                          <span className="font-mono">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* Itens da fatura */}
            <div className="mt-1 flex items-center justify-between">
              <p className="ml-0.5 text-[12.5px] text-text-dim">
                Itens desta fatura
              </p>
              <button
                onClick={() => setShowForm((v) => !v)}
                className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11.5px] font-medium text-accent"
              >
                {showForm ? <X size={13} /> : <Plus size={13} />}
                {showForm ? "Cancelar" : "Adicionar"}
              </button>
            </div>

            {showForm && (
              <Card className="p-4">
                <form onSubmit={handleAdicionar} className="flex flex-col gap-2.5">
                  <input
                    type="text"
                    placeholder="Descrição"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="rounded-xl border border-line bg-bg-panel-raised px-3 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Valor (ex: 120,50)"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="rounded-xl border border-line bg-bg-panel-raised px-3 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  <div className="flex gap-2.5">
                    <select
                      value={categoriaId}
                      onChange={(e) => setCategoriaId(e.target.value)}
                      className="flex-1 rounded-xl border border-line bg-bg-panel-raised px-3 py-2.5 text-sm outline-none focus:border-accent"
                    >
                      <option value="">Sem categoria</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      value={pessoaId}
                      onChange={(e) => setPessoaId(e.target.value)}
                      className="flex-1 rounded-xl border border-line bg-bg-panel-raised px-3 py-2.5 text-sm outline-none focus:border-accent"
                    >
                      <option value="">Sem pessoa</option>
                      {pessoas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {erro && <p className="text-[12.5px] text-coral">{erro}</p>}

                  <button
                    type="submit"
                    disabled={salvando}
                    className="mt-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-bg disabled:opacity-60"
                  >
                    {salvando ? "Salvando..." : "Adicionar item"}
                  </button>
                </form>
              </Card>
            )}

            <div className="flex flex-col gap-2">
              {transacoes.length === 0 && !showForm && (
                <p className="px-1 py-4 text-center text-[12.5px] text-text-dim">
                  Nenhum item nesta fatura ainda.
                </p>
              )}
              {transacoes.map((t) => {
                const categoria = t.categoria_id
                  ? categoriaPorId.get(t.categoria_id)
                  : undefined;
                const pessoa = t.pessoa_id
                  ? pessoaPorId.get(t.pessoa_id)
                  : undefined;
                const cor = categoria?.cor ?? "#8C97A3";
                return (
                  <Card key={t.id} className="flex items-center gap-3 p-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
                      style={{ background: `${cor}22` }}
                    >
                      <CreditCard size={15} style={{ color: cor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[13px]">{t.descricao}</p>
                        {pessoa && <Avatar nome={pessoa.nome} cor={pessoa.cor} small />}
                      </div>
                      <p className="mt-0.5 text-[11px] text-text-dim">
                        {categoria?.nome ?? "Sem categoria"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[13px]">
                        {formatBRL(Number(t.valor))}
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-text-dim">
                        {formatDataCurta(t.data)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemover(t.id)}
                      disabled={removendoId === t.id}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-dim active:bg-bg-panel-raised active:text-coral disabled:opacity-50"
                      aria-label="Remover item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
