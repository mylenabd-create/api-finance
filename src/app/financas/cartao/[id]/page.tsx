import { notFound, redirect } from "next/navigation";
import { getContaAtual } from "@/lib/conta";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";
import { CartaoClient } from "./CartaoClient";

export default async function CartaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const conta = await getContaAtual();
  if (!conta) redirect("/login");

  const supabase = await createClient();

  const { data: cartao } = await supabase
    .from("cartao")
    .select("*")
    .eq("conta_id", conta.contaId)
    .eq("id", id)
    .maybeSingle();

  if (!cartao) notFound();

  // Fatura mais recente (maior mes_referencia) deste cartão.
  const { data: faturas } = await supabase
    .from("fatura")
    .select("*")
    .eq("conta_id", conta.contaId)
    .eq("cartao_id", cartao.id)
    .order("mes_referencia", { ascending: false })
    .limit(1);

  const faturaAtual: Tables<"fatura"> | null =
    faturas && faturas.length > 0 ? faturas[0] : null;

  // Transações da fatura atual + categorias e pessoas da conta (join em JS).
  const [{ data: transacoes }, { data: categorias }, { data: pessoas }] =
    await Promise.all([
      faturaAtual
        ? supabase
            .from("transacao")
            .select("*")
            .eq("conta_id", conta.contaId)
            .eq("fatura_id", faturaAtual.id)
            .order("data", { ascending: false })
        : Promise.resolve({ data: [] as Tables<"transacao">[] }),
      supabase
        .from("categoria")
        .select("*")
        .eq("conta_id", conta.contaId)
        .order("nome", { ascending: true }),
      supabase
        .from("pessoa")
        .select("*")
        .eq("conta_id", conta.contaId)
        .order("created_at", { ascending: true }),
    ]);

  return (
    <CartaoClient
      contaId={conta.contaId}
      cartao={cartao}
      faturaAtual={faturaAtual}
      transacoesIniciais={(transacoes ?? []) as Tables<"transacao">[]}
      categorias={(categorias ?? []) as Tables<"categoria">[]}
      pessoas={(pessoas ?? []) as Tables<"pessoa">[]}
    />
  );
}
