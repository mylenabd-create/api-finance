import { redirect } from "next/navigation";
import { getContaAtual } from "@/lib/conta";
import { createClient } from "@/lib/supabase/server";
import { PainelClient, type ModuleData } from "@/app/PainelClient";
import type { Tables } from "@/lib/database.types";
import { formatBRL } from "@/lib/format";
import { fraseDoDia } from "@/lib/fraseDoDia";

function inicioMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function inicioSemana(d: Date) {
  // segunda-feira como início da semana
  const dia = d.getDay(); // 0 = domingo
  const diff = dia === 0 ? -6 : 1 - dia;
  const inicio = new Date(d);
  inicio.setDate(d.getDate() + diff);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

function toDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

function duracaoSono(dormiu: string | null, acordou: string | null): string | null {
  if (!dormiu || !acordou) return null;
  const [h1, m1] = dormiu.split(":").map(Number);
  const [h2, m2] = acordou.split(":").map(Number);
  let minutos = h2 * 60 + m2 - (h1 * 60 + m1);
  if (minutos <= 0) minutos += 24 * 60; // virada de dia
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export default async function Home() {
  const conta = await getContaAtual();
  if (!conta) redirect("/login");

  const supabase = await createClient();
  const hoje = new Date();
  const hojeStr = toDateOnly(hoje);
  const inicioMesStr = toDateOnly(inicioMes(hoje));
  const inicioSemanaStr = toDateOnly(inicioSemana(hoje));

  const [
    { data: lembretes },
    { data: pessoas },
    { data: transacoes },
    { data: metas },
    { data: habitos },
    { data: habitoRegistrosHoje },
    { data: praticas },
    { data: livros },
    { data: treinos },
    { data: tarefas },
    { data: compromissos },
    { data: sonos },
    { data: receitasMes },
  ] = await Promise.all([
    supabase
      .from("lembrete")
      .select("*")
      .eq("conta_id", conta.contaId)
      .eq("dispensado", false)
      .order("data_disparo", { ascending: true }),
    supabase
      .from("pessoa")
      .select("*")
      .eq("conta_id", conta.contaId)
      .order("created_at", { ascending: true }),
    supabase
      .from("transacao")
      .select("valor, data")
      .eq("conta_id", conta.contaId)
      .gte("data", inicioMesStr),
    supabase
      .from("meta")
      .select("*")
      .eq("conta_id", conta.contaId)
      .eq("mes_referencia", inicioMesStr),
    supabase.from("habito").select("*").eq("conta_id", conta.contaId),
    supabase
      .from("habito_registro")
      .select("habito_id, concluido, data")
      .eq("data", hojeStr)
      .eq("concluido", true),
    supabase
      .from("pratica_espiritual")
      .select("data")
      .eq("conta_id", conta.contaId)
      .order("data", { ascending: false }),
    supabase
      .from("livro")
      .select("*")
      .eq("conta_id", conta.contaId)
      .eq("atual", true)
      .limit(1),
    supabase
      .from("treino")
      .select("id, data")
      .eq("conta_id", conta.contaId)
      .gte("data", inicioSemanaStr),
    supabase
      .from("tarefa")
      .select("id, prazo, status")
      .eq("conta_id", conta.contaId)
      .neq("status", "concluida"),
    supabase
      .from("compromisso")
      .select("*")
      .eq("conta_id", conta.contaId)
      .gte("data", hojeStr)
      .order("data", { ascending: true })
      .order("hora", { ascending: true }),
    supabase
      .from("registro_sono")
      .select("*")
      .eq("conta_id", conta.contaId)
      .order("data", { ascending: false })
      .limit(1),
    supabase
      .from("receita")
      .select("valor")
      .eq("conta_id", conta.contaId)
      .gte("data", inicioMesStr),
  ]);

  // habito_registro não tem conta_id: filtra pelos ids de habito já escopados pela conta
  const habitoIds = new Set((habitos ?? []).map((h) => h.id));
  const concluidosHojeCount = (habitoRegistrosHoje ?? []).filter((r) =>
    habitoIds.has(r.habito_id)
  ).length;

  const nomePessoa = pessoas && pessoas.length > 0 ? pessoas[0].nome : "Você";

  // ===== Finanças =====
  const gastoMes = (transacoes ?? []).reduce((acc, t) => acc + Number(t.valor), 0);
  const somaMetas = (metas ?? []).reduce((acc, m) => acc + Number(m.valor), 0);
  const progressoFinancas = somaMetas > 0 ? gastoMes / somaMetas : null;
  const recebidoMes = (receitasMes ?? []).reduce((acc, r) => acc + Number(r.valor), 0);
  const saldoMes = recebidoMes - gastoMes;

  // ===== Espiritual: sequência de dias consecutivos até hoje =====
  const diasPratica = new Set((praticas ?? []).map((p) => p.data));
  let sequenciaEspiritual = 0;
  {
    const cursor = new Date(hoje);
    // se hoje ainda não praticou, a sequência considera a partir de ontem
    if (!diasPratica.has(hojeStr)) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (diasPratica.has(toDateOnly(cursor))) {
      sequenciaEspiritual += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }
  const praticouHoje = diasPratica.has(hojeStr);

  // ===== Leitura =====
  const livroAtual: Tables<"livro"> | null = livros && livros.length > 0 ? livros[0] : null;

  // ===== Exercício =====
  const treinosSemana = treinos?.length ?? 0;

  // ===== Tarefas =====
  const tarefasPendentes = tarefas?.length ?? 0;
  const tarefasComPrazoHoje = (tarefas ?? []).filter((t) => t.prazo === hojeStr).length;

  // ===== Agenda: próximo compromisso (data + hora mais próxima no futuro) =====
  const agoraMinutos = hoje.getHours() * 60 + hoje.getMinutes();
  const proximoCompromisso =
    (compromissos ?? []).find((c) => {
      if (c.data > hojeStr) return true;
      if (c.data < hojeStr) return false;
      if (!c.hora) return true;
      const [h, m] = c.hora.split(":").map(Number);
      return h * 60 + m >= agoraMinutos;
    }) ?? null;

  // ===== Sono =====
  const ultimoSono = sonos && sonos.length > 0 ? sonos[0] : null;
  const duracaoSonoStr = ultimoSono
    ? duracaoSono(ultimoSono.hora_dormiu, ultimoSono.hora_acordou)
    : null;

  // ===== Trabalho x vida pessoal: compromissos tipo=trabalho hoje =====
  // (derivado de `compromissos`, já buscado acima — evita uma query extra)
  const compromissosTrabalhoHoje = (compromissos ?? []).filter(
    (c) => c.data === hojeStr && c.tipo === "trabalho"
  ).length;

  const modules: ModuleData[] = [
    {
      key: "financas",
      href: "/financas",
      title: "Finanças",
      // saldo do mês = tudo que entrou − tudo que saiu
      metric: gastoMes > 0 || recebidoMes > 0 ? formatBRL(saldoMes) : "—",
      sub: "saldo do mês",
      detail:
        gastoMes > 0 || recebidoMes > 0
          ? `entrou ${formatBRL(recebidoMes)} · saiu ${formatBRL(gastoMes)}`
          : "nenhum lançamento ainda",
      progress: progressoFinancas,
      color: "var(--accent)",
      icon: "Wallet",
    },
    {
      key: "habitos",
      href: "/habitos",
      title: "Hábitos",
      metric: habitos && habitos.length > 0 ? `${concluidosHojeCount}/${habitos.length}` : "—",
      sub: "concluídos hoje",
      detail:
        habitos && habitos.length > 0
          ? `${concluidosHojeCount} de ${habitos.length} concluídos hoje`
          : "nenhum hábito cadastrado",
      progress: habitos && habitos.length > 0 ? concluidosHojeCount / habitos.length : null,
      color: "var(--coral)",
      icon: "Flame",
    },
    {
      key: "espiritual",
      href: "/espiritual",
      title: "Espiritual",
      metric: sequenciaEspiritual > 0 ? `${sequenciaEspiritual} dias` : "—",
      sub: "prática seguida",
      detail: praticouHoje ? "registrado hoje" : "ainda não registrado hoje",
      progress: praticouHoje ? 1 : sequenciaEspiritual > 0 ? 0.5 : null,
      color: "var(--purple)",
      icon: "Sparkles",
    },
    {
      key: "leitura",
      href: "/espiritual",
      title: "Leitura",
      metric: livroAtual ? `${Math.round(Number(livroAtual.progresso))}%` : "—",
      sub: livroAtual ? `"${livroAtual.titulo}"` : "nenhum livro em andamento",
      detail: livroAtual ? "em andamento" : "nenhum ainda",
      progress: livroAtual ? Number(livroAtual.progresso) / 100 : null,
      color: "var(--teal)",
      icon: "BookOpen",
    },
    {
      key: "exercicio",
      href: "/habitos",
      title: "Exercício",
      metric: treinosSemana > 0 ? `${treinosSemana}x` : "—",
      sub: "treinos essa semana",
      detail: treinosSemana > 0 ? "desde segunda-feira" : "nenhum treino essa semana",
      progress: null,
      color: "var(--blue)",
      icon: "Dumbbell",
    },
    {
      key: "tarefas",
      href: "/agenda",
      title: "Tarefas",
      metric: tarefasPendentes > 0 ? `${tarefasPendentes}` : "—",
      sub: "pendentes",
      detail:
        tarefasPendentes > 0
          ? `${tarefasComPrazoHoje} com prazo hoje`
          : "nenhuma tarefa pendente",
      progress: null,
      color: "var(--text-dim)",
      icon: "ListChecks",
    },
    {
      key: "agenda",
      href: "/agenda",
      title: "Agenda",
      metric: proximoCompromisso
        ? proximoCompromisso.hora
          ? proximoCompromisso.hora.slice(0, 5)
          : proximoCompromisso.data === hojeStr
            ? "hoje"
            : "—"
        : "—",
      sub: proximoCompromisso ? proximoCompromisso.titulo : "nenhum compromisso",
      detail: proximoCompromisso ? "próximo compromisso" : "agenda livre",
      progress: null,
      color: "var(--accent)",
      icon: "Calendar",
    },
    {
      key: "sono",
      href: "/habitos",
      title: "Sono",
      metric: duracaoSonoStr ?? "—",
      sub: "última noite",
      detail: duracaoSonoStr ? "registrado" : "nenhum registro ainda",
      progress: null,
      color: "var(--blue)",
      icon: "Moon",
    },
    {
      key: "trabalho",
      href: "/agenda",
      title: "Trabalho x vida pessoal",
      metric: compromissosTrabalhoHoje > 0 ? `${compromissosTrabalhoHoje}` : "—",
      sub: "compromissos de trabalho hoje",
      detail: compromissosTrabalhoHoje > 0 ? "hoje" : "nenhum hoje",
      progress: null,
      color: "var(--coral)",
      icon: "Briefcase",
    },
  ];

  const frase = fraseDoDia({
    nome: nomePessoa,
    // dia no fuso de Brasília, para a frase virar à meia-noite daqui
    hojeStr: hoje.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }),
    habitos: (habitos ?? []).map((h) => h.nome),
    livroAtual: livroAtual?.titulo ?? null,
    sequenciaEspiritual,
    praticouHoje,
    treinosSemana,
    tarefasPendentes,
    temMetaFinanceira: somaMetas > 0,
    progressoFinancas,
  });

  return (
    <PainelClient
      frase={frase}
      balanco={{ entrou: recebidoMes, saiu: gastoMes, saldo: saldoMes, meta: somaMetas }}
      nomePessoa={nomePessoa}
      lembretes={(lembretes ?? []) as Tables<"lembrete">[]}
      modules={modules}
    />
  );
}
