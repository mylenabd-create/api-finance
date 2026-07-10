import { redirect } from "next/navigation";
import { getContaAtual } from "@/lib/conta";
import { createClient } from "@/lib/supabase/server";
import { FinancasClient } from "./FinancasClient";
import type {
  Categoria,
  FaturaAgregada,
  MetaComCategoria,
  Pessoa,
  ReceitaComPessoa,
  TransacaoComRelacoes,
} from "./types";

function inicioFimMesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const inicio = new Date(ano, mes, 1);
  const fim = new Date(ano, mes + 1, 1);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  return {
    mesReferencia: toISODate(inicio),
    inicio: toISODate(inicio),
    fim: toISODate(fim),
  };
}

export default async function FinancasPage() {
  const conta = await getContaAtual();
  if (!conta) redirect("/login");

  const supabase = await createClient();
  const { mesReferencia, inicio, fim } = inicioFimMesAtual();

  const [
    { data: pessoas },
    { data: categorias },
    { data: metasRaw },
    { data: transacoesRaw },
    { data: receitasRaw },
    { data: lancamentosFuturos },
  ] = await Promise.all([
    supabase
      .from("pessoa")
      .select("*")
      .eq("conta_id", conta.contaId)
      .order("created_at", { ascending: true }),
    supabase
      .from("categoria")
      .select("*")
      .eq("conta_id", conta.contaId)
      .order("nome", { ascending: true }),
    supabase
      .from("meta")
      .select("*")
      .eq("conta_id", conta.contaId)
      .eq("mes_referencia", mesReferencia),
    supabase
      .from("transacao")
      .select("*")
      .eq("conta_id", conta.contaId)
      .gte("data", inicio)
      .lt("data", fim)
      .order("data", { ascending: false }),
    supabase
      .from("receita")
      .select("*")
      .eq("conta_id", conta.contaId)
      .gte("data", inicio)
      .lt("data", fim)
      .order("data", { ascending: false }),
    supabase
      .from("lancamento_futuro")
      .select("*")
      .eq("conta_id", conta.contaId)
      .order("data_inicio", { ascending: true }),
  ]);

  const pessoasList: Pessoa[] = pessoas ?? [];
  const categoriasList: Categoria[] = categorias ?? [];
  const pessoaMap = new Map(pessoasList.map((p) => [p.id, p]));
  const categoriaMap = new Map(categoriasList.map((c) => [c.id, c]));

  const metas: MetaComCategoria[] = (metasRaw ?? []).map((m) => ({
    ...m,
    categoria: categoriaMap.get(m.categoria_id) ?? null,
  }));

  const transacoesTodas = transacoesRaw ?? [];

  // Junta transações com fatura_id numa linha agregada por fatura.
  const faturaIds = Array.from(
    new Set(transacoesTodas.map((t) => t.fatura_id).filter((id): id is string => !!id))
  );

  let faturas: FaturaAgregada[] = [];
  if (faturaIds.length > 0) {
    const { data: faturasRaw } = await supabase
      .from("fatura")
      .select("*")
      .in("id", faturaIds);

    const faturaCartaoMap = new Map((faturasRaw ?? []).map((f) => [f.id, f.cartao_id]));

    const agregados = new Map<string, FaturaAgregada>();
    for (const t of transacoesTodas) {
      if (!t.fatura_id) continue;
      const cartaoId = faturaCartaoMap.get(t.fatura_id);
      if (!cartaoId) continue;
      const existente = agregados.get(t.fatura_id);
      if (existente) {
        existente.totalValor += Number(t.valor);
        existente.qtdItens += 1;
        if (t.data > existente.dataMaisRecente) existente.dataMaisRecente = t.data;
      } else {
        agregados.set(t.fatura_id, {
          faturaId: t.fatura_id,
          cartaoId,
          totalValor: Number(t.valor),
          qtdItens: 1,
          dataMaisRecente: t.data,
        });
      }
    }
    faturas = Array.from(agregados.values());
  }

  // Transações sem fatura_id viram lançamentos individuais na lista.
  const transacoes: TransacaoComRelacoes[] = transacoesTodas
    .filter((t) => !t.fatura_id)
    .map((t) => ({
      ...t,
      categoria: t.categoria_id ? categoriaMap.get(t.categoria_id) ?? null : null,
      pessoa: t.pessoa_id ? pessoaMap.get(t.pessoa_id) ?? null : null,
    }));

  // Para totais/gráficos por categoria e pessoa, precisamos de TODAS as
  // transações do mês (incluindo as de fatura), então mantemos uma lista
  // completa cruzada também.
  const transacoesCompletas: TransacaoComRelacoes[] = transacoesTodas.map((t) => ({
    ...t,
    categoria: t.categoria_id ? categoriaMap.get(t.categoria_id) ?? null : null,
    pessoa: t.pessoa_id ? pessoaMap.get(t.pessoa_id) ?? null : null,
  }));

  const receitas: ReceitaComPessoa[] = (receitasRaw ?? []).map((r) => ({
    ...r,
    pessoa: r.pessoa_id ? pessoaMap.get(r.pessoa_id) ?? null : null,
  }));

  return (
    <FinancasClient
      contaId={conta.contaId}
      pessoas={pessoasList}
      categorias={categoriasList}
      metas={metas}
      transacoes={transacoes}
      transacoesCompletas={transacoesCompletas}
      faturas={faturas}
      receitas={receitas}
      lancamentosFuturos={lancamentosFuturos ?? []}
      mesReferencia={mesReferencia}
    />
  );
}
