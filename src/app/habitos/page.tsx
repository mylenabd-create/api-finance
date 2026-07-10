import { redirect } from "next/navigation";
import { getContaAtual } from "@/lib/conta";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";
import { HabitosClient } from "./HabitosClient";

function toDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

function diasAtras(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateOnly(d);
}

export default async function HabitosPage() {
  const conta = await getContaAtual();
  if (!conta) redirect("/login");

  const supabase = await createClient();

  const [{ data: pessoas }, { data: habitos }, { data: sono }, { data: treinos }, { data: avaliacoes }] =
    await Promise.all([
      supabase
        .from("pessoa")
        .select("*")
        .eq("conta_id", conta.contaId)
        .order("created_at", { ascending: true }),
      supabase
        .from("habito")
        .select("*")
        .eq("conta_id", conta.contaId)
        .order("created_at", { ascending: true }),
      supabase
        .from("registro_sono")
        .select("*")
        .eq("conta_id", conta.contaId)
        .order("data", { ascending: false })
        .limit(30),
      supabase
        .from("treino")
        .select("*")
        .eq("conta_id", conta.contaId)
        .order("data", { ascending: false })
        .limit(30),
      supabase
        .from("avaliacao_bioimpedancia")
        .select("*")
        .eq("conta_id", conta.contaId)
        .order("data", { ascending: true }),
    ]);

  const habitosLista = (habitos ?? []) as Tables<"habito">[];
  const habitoIds = habitosLista.map((h) => h.id);

  // Registros dos últimos 60 dias, escopados via habito_id (habito_registro não tem conta_id direto).
  const desde = diasAtras(60);
  const { data: registros } =
    habitoIds.length > 0
      ? await supabase
          .from("habito_registro")
          .select("*")
          .in("habito_id", habitoIds)
          .gte("data", desde)
          .order("data", { ascending: true })
      : { data: [] as Tables<"habito_registro">[] };

  return (
    <HabitosClient
      pessoas={(pessoas ?? []) as Tables<"pessoa">[]}
      habitos={habitosLista}
      registros={(registros ?? []) as Tables<"habito_registro">[]}
      registrosSono={(sono ?? []) as Tables<"registro_sono">[]}
      treinos={(treinos ?? []) as Tables<"treino">[]}
      avaliacoes={(avaliacoes ?? []) as Tables<"avaliacao_bioimpedancia">[]}
    />
  );
}
