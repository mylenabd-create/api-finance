"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Plus, Wallet } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import { formatBRL } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { iconeCategoria } from "./icons";
import type {
  Categoria,
  FaturaAgregada,
  MetaComCategoria,
  Pessoa,
  TransacaoComRelacoes,
} from "./types";

function metaValorAlvo(m: MetaComCategoria, totalReceita: number) {
  return m.tipo === "percentual" ? (totalReceita * Number(m.valor)) / 100 : Number(m.valor);
}

export function DespesasTab({
  contaId,
  categorias,
  pessoas,
  metas,
  transacoes,
  transacoesCompletas,
  faturas,
}: {
  contaId: string;
  categorias: Categoria[];
  pessoas: Pessoa[];
  metas: MetaComCategoria[];
  transacoes: TransacaoComRelacoes[];
  transacoesCompletas: TransacaoComRelacoes[];
  faturas: FaturaAgregada[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [pessoaId, setPessoaId] = useState(pessoas[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  const totalGasto = transacoesCompletas.reduce((s, t) => s + Number(t.valor), 0);
  const totalMetas = metas.reduce((s, m) => s + metaValorAlvo(m, totalGasto), 0);

  // Ritmo acumulado de gastos no mês, derivado de transacao.data.
  const trend = useMemo(() => {
    const porDia = new Map<number, number>();
    for (const t of transacoesCompletas) {
      const dia = Number(t.data.slice(8, 10));
      porDia.set(dia, (porDia.get(dia) ?? 0) + Number(t.valor));
    }
    const diasComMovimento = Array.from(porDia.keys()).sort((a, b) => a - b);
    if (diasComMovimento.length === 0) return [];
    let acumulado = 0;
    const pontos: { dia: string; valor: number }[] = [];
    for (const dia of diasComMovimento) {
      acumulado += porDia.get(dia)!;
      pontos.push({ dia: String(dia), valor: acumulado });
    }
    return pontos;
  }, [transacoesCompletas]);

  // Donut por categoria.
  const porCategoria = useMemo(() => {
    const map = new Map<string, { nome: string; cor: string; valor: number }>();
    for (const t of transacoesCompletas) {
      const cat = t.categoria;
      const key = cat?.id ?? "sem-categoria";
      const nome = cat?.nome ?? "Sem categoria";
      const cor = cat?.cor ?? "#8C97A3";
      const atual = map.get(key);
      if (atual) atual.valor += Number(t.valor);
      else map.set(key, { nome, cor, valor: Number(t.valor) });
    }
    return Array.from(map.values()).sort((a, b) => b.valor - a.valor);
  }, [transacoesCompletas]);

  // Donut por pessoa.
  const porPessoa = useMemo(() => {
    const map = new Map<string, { nome: string; cor: string; valor: number }>();
    for (const t of transacoesCompletas) {
      const p = t.pessoa;
      const key = p?.id ?? "sem-pessoa";
      const nome = p?.nome ?? "Sem pessoa";
      const cor = p?.cor ?? "#8C97A3";
      const atual = map.get(key);
      if (atual) atual.valor += Number(t.valor);
      else map.set(key, { nome, cor, valor: Number(t.valor) });
    }
    return Array.from(map.values()).sort((a, b) => b.valor - a.valor);
  }, [transacoesCompletas]);

  // Gasto por categoria (para a lista com barra de progresso vs meta).
  const gastoPorCategoriaId = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transacoesCompletas) {
      if (!t.categoria_id) continue;
      map.set(t.categoria_id, (map.get(t.categoria_id) ?? 0) + Number(t.valor));
    }
    return map;
  }, [transacoesCompletas]);

  async function addDespesa() {
    const v = Number(valor.replace(",", "."));
    if (!descricao.trim() || !v || v <= 0) return;
    setSaving(true);
    await supabase.from("transacao").insert({
      conta_id: contaId,
      descricao: descricao.trim(),
      valor: v,
      data: new Date().toISOString().slice(0, 10),
      categoria_id: categoriaId || null,
      pessoa_id: pessoaId || null,
      origem: "manual",
    });
    setDescricao("");
    setValor("");
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-[18px]">
        <p className="m-0 text-xs text-text-dim">Total gasto no mês</p>
        <p className="font-mono m-0 mt-1 mb-0.5 text-[28px] font-medium">{formatBRL(totalGasto)}</p>
        <p className="m-0 mb-2.5 text-xs text-text-dim">
          {totalMetas > 0 ? `de ${formatBRL(totalMetas)} planejado` : "nenhuma meta definida para o mês"}
        </p>
        {totalMetas > 0 && (
          <ProgressBar
            progress={totalGasto / totalMetas}
            color={totalGasto > totalMetas ? "var(--coral)" : "var(--accent)"}
            height={6}
          />
        )}
      </Card>

      {trend.length > 0 && (
        <Card className="pt-3.5 pr-2.5 pb-1.5 pl-2.5">
          <p className="m-0 mb-1 ml-2 text-[12.5px] text-text-dim">Ritmo de gastos no mês</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={trend} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#ECE8F3" vertical={false} />
              <XAxis dataKey="dia" stroke="#6B6880" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  color: "#1A1A2E",
                  fontSize: 12,
                }}
                formatter={(v) => formatBRL(Number(v))}
              />
              <Line type="monotone" dataKey="valor" stroke="#4B00C8" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {porCategoria.length > 0 && (
        <Card className="p-4">
          <p className="m-0 mb-2 ml-0.5 text-[12.5px] text-text-dim">Para onde foi o seu dinheiro</p>
          <div className="flex items-center gap-4">
            <div className="relative h-[140px] w-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={porCategoria}
                    dataKey="valor"
                    nameKey="nome"
                    innerRadius={44}
                    outerRadius={68}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {porCategoria.map((c, i) => (
                      <Cell key={i} fill={c.cor} stroke="var(--bg-panel)" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-[15px] font-medium">{formatBRL(totalGasto)}</span>
                <span className="text-[10px] text-text-dim">no mês</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              {porCategoria.map((c, i) => {
                const pct = totalGasto > 0 ? Math.round((c.valor / totalGasto) * 100) : 0;
                return (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-text-dim">
                      <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: c.cor }} />
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

      {porPessoa.length > 0 && (
        <Card className="p-4">
          <p className="m-0 mb-2 ml-0.5 text-[12.5px] text-text-dim">Gastos por pessoa</p>
          <div className="flex items-center gap-4">
            <div className="relative h-[140px] w-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={porPessoa}
                    dataKey="valor"
                    nameKey="nome"
                    innerRadius={44}
                    outerRadius={68}
                    paddingAngle={3}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {porPessoa.map((p, i) => (
                      <Cell key={i} fill={p.cor} stroke="var(--bg-panel)" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-[15px] font-medium">{formatBRL(totalGasto)}</span>
                <span className="text-[10px] text-text-dim">no mês</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {porPessoa.map((p, i) => {
                const pct = totalGasto > 0 ? Math.round((p.valor / totalGasto) * 100) : 0;
                return (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-text-dim">
                      <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: p.cor }} />
                      {p.nome}
                    </span>
                    <span className="font-mono">
                      {pct}% · {formatBRL(p.valor)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {metas.length > 0 && (
        <div>
          <p className="m-0 mb-2 ml-0.5 text-[12.5px] text-text-dim">Categorias</p>
          <div className="flex flex-col gap-2">
            {metas.map((m) => {
              const gasto = m.categoria_id ? gastoPorCategoriaId.get(m.categoria_id) ?? 0 : 0;
              const goal = metaValorAlvo(m, totalGasto);
              const over = gasto > goal;
              const Icon = iconeCategoria(m.categoria?.icone ?? m.categoria?.nome);
              const cor = m.categoria?.cor ?? "#8C97A3";
              return (
                <Card key={m.id} className="flex items-center gap-3 p-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
                    style={{ background: `${cor}22` }}
                  >
                    <Icon size={15} color={cor} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span>{m.categoria?.nome ?? "Categoria"}</span>
                      <span>
                        <span className="font-mono" style={{ color: over ? "var(--coral)" : "var(--teal)" }}>
                          {formatBRL(gasto)}
                        </span>
                        <span className="font-mono text-[11.5px] text-text-dim"> de {formatBRL(goal)}</span>
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar
                        progress={goal > 0 ? gasto / goal : 0}
                        color={over ? "var(--coral)" : "var(--teal)"}
                        height={4}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="m-0 mb-2 ml-0.5 text-[12.5px] text-text-dim">Lançamentos recentes</p>
        <div className="flex flex-col gap-2">
          {faturas.map((f) => (
            <Link key={f.faturaId} href={`/financas/cartao/${f.cartaoId}`}>
              <Card className="flex items-center gap-3 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-accent-soft">
                  <Wallet size={15} color="var(--accent)" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[13px]">Fatura do cartão</p>
                  <p className="m-0 mt-0.5 text-[11px] text-text-dim">{f.qtdItens} itens · toque para ver o detalhe</p>
                </div>
                <div className="flex items-center gap-1.5 text-right">
                  <p className="font-mono m-0 text-[13px]">{formatBRL(f.totalValor)}</p>
                  <ChevronRight size={14} color="var(--text-dim)" />
                </div>
              </Card>
            </Link>
          ))}
          {transacoes.map((t) => {
            const Icon = iconeCategoria(t.categoria?.icone ?? t.categoria?.nome);
            const cor = t.categoria?.cor ?? "#8C97A3";
            return (
              <Card key={t.id} className="flex items-center gap-3 p-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
                  style={{ background: `${cor}22` }}
                >
                  <Icon size={15} color={cor} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="m-0 text-[13px]">{t.descricao}</p>
                    {t.pessoa && <Avatar nome={t.pessoa.nome} cor={t.pessoa.cor} small />}
                  </div>
                  <p className="m-0 mt-0.5 text-[11px] text-text-dim">{t.categoria?.nome ?? "Sem categoria"}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono m-0 text-[13px]">{formatBRL(Number(t.valor))}</p>
                  <p className="m-0 mt-0.5 text-[10.5px] text-text-dim">
                    {new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </p>
                </div>
              </Card>
            );
          })}
          {faturas.length === 0 && transacoes.length === 0 && (
            <p className="text-xs text-text-dim">Nenhum lançamento neste mês ainda.</p>
          )}
        </div>
      </div>

      <Card className="flex flex-col gap-2 p-3">
        <p className="m-0 text-[12px] text-text-dim">Adicionar despesa</p>
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição (ex: Uber)"
          className="w-full rounded-lg border border-line bg-bg-panel-raised px-2.5 py-2 text-[13px] text-text outline-none"
        />
        <div className="flex gap-2">
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Valor"
            inputMode="decimal"
            className="font-mono w-full rounded-lg border border-line bg-bg-panel-raised px-2.5 py-2 text-[13px] text-text outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-1/2 rounded-lg border border-line bg-bg-panel-raised px-2.5 py-2 text-[13px] text-text outline-none"
          >
            {categorias.length === 0 && <option value="">Sem categoria</option>}
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
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
        </div>
        <button
          onClick={addDespesa}
          disabled={saving}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-accent py-2 text-[13px] font-medium text-on-accent disabled:opacity-50"
        >
          <Plus size={15} /> Adicionar
        </button>
      </Card>
    </div>
  );
}
