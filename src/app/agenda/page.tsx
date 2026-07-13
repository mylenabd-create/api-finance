import { redirect } from "next/navigation";
import { getContaAtual } from "@/lib/conta";
import { createClient } from "@/lib/supabase/server";
import { AgendaClient } from "./AgendaClient";
import type { Compromisso, CompromissoComPessoa, Pessoa, Tarefa, TarefaComPessoa } from "./types";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AgendaPage() {
  const conta = await getContaAtual();
  if (!conta) redirect("/login");

  const supabase = await createClient();
  const hoje = hojeISO();

  const [{ data: pessoas }, { data: compromissosRaw }, { data: tarefasRaw }, { data: conexaoGoogle }] =
    await Promise.all([
      supabase
        .from("pessoa")
        .select("*")
        .eq("conta_id", conta.contaId)
        .order("created_at", { ascending: true }),
      supabase
        .from("compromisso")
        .select("*")
        .eq("conta_id", conta.contaId)
        .gte("data", hoje)
        .order("data", { ascending: true })
        .order("hora", { ascending: true }),
      supabase
        .from("tarefa")
        .select("*")
        .eq("conta_id", conta.contaId)
        .order("prazo", { ascending: true }),
      supabase
        .from("google_calendar_conexao")
        .select("ultima_sincronizacao")
        .eq("user_id", conta.userId)
        .maybeSingle(),
    ]);

  const pessoasList: Pessoa[] = pessoas ?? [];
  const pessoaMap = new Map(pessoasList.map((p) => [p.id, p]));

  const compromissos: CompromissoComPessoa[] = (compromissosRaw ?? []).map(
    (c: Compromisso) => ({
      ...c,
      pessoa: c.pessoa_id ? pessoaMap.get(c.pessoa_id) ?? null : null,
    })
  );

  const tarefas: TarefaComPessoa[] = (tarefasRaw ?? []).map((t: Tarefa) => ({
    ...t,
    pessoa: t.pessoa_id ? pessoaMap.get(t.pessoa_id) ?? null : null,
    atrasadaCalculada: !!t.prazo && t.prazo < hoje && t.status !== "concluida",
  }));

  // Para a aba "trabalho x vida pessoal" também precisamos dos compromissos
  // já passados desta semana (não só os futuros buscados acima).
  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  const inicioSemanaISO = inicioSemana.toISOString().slice(0, 10);

  const { data: compromissosSemanaRaw } = await supabase
    .from("compromisso")
    .select("*")
    .eq("conta_id", conta.contaId)
    .gte("data", inicioSemanaISO)
    .lte("data", hoje);

  const compromissosSemanaPassada: CompromissoComPessoa[] = (
    compromissosSemanaRaw ?? []
  ).map((c: Compromisso) => ({
    ...c,
    pessoa: c.pessoa_id ? pessoaMap.get(c.pessoa_id) ?? null : null,
  }));

  return (
    <AgendaClient
      contaId={conta.contaId}
      pessoas={pessoasList}
      compromissos={compromissos}
      compromissosSemanaPassada={compromissosSemanaPassada}
      tarefas={tarefas}
      hoje={hoje}
      googleConectado={!!conexaoGoogle}
      ultimaSincronizacaoGoogle={conexaoGoogle?.ultima_sincronizacao ?? null}
    />
  );
}
