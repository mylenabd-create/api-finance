import { redirect } from "next/navigation";
import { getContaAtual } from "@/lib/conta";
import { createClient } from "@/lib/supabase/server";
import { EspiritualClient } from "./EspiritualClient";

function diasAtras(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default async function EspiritualPage() {
  const conta = await getContaAtual();
  if (!conta) redirect("/login");

  const supabase = await createClient();
  const desde = diasAtras(60);

  const [{ data: pessoas }, { data: praticas }, { data: livros }] = await Promise.all([
    supabase
      .from("pessoa")
      .select("*")
      .eq("conta_id", conta.contaId)
      .order("created_at", { ascending: true }),
    supabase
      .from("pratica_espiritual")
      .select("*")
      .eq("conta_id", conta.contaId)
      .gte("data", desde)
      .order("data", { ascending: false }),
    supabase
      .from("livro")
      .select("*")
      .eq("conta_id", conta.contaId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <EspiritualClient
      contaId={conta.contaId}
      pessoas={pessoas ?? []}
      praticas={praticas ?? []}
      livros={livros ?? []}
    />
  );
}
