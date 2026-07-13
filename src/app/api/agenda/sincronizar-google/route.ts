import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getContaAtual } from "@/lib/conta";
import { listGoogleCalendarEvents, refreshGoogleAccessToken } from "@/lib/googleCalendar";

// Lê os eventos do Google Calendar do usuário conectado e grava/atualiza os
// compromissos correspondentes (casados por google_event_id).
export async function POST() {
  const conta = await getContaAtual();
  if (!conta) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: conexao } = await supabase
    .from("google_calendar_conexao")
    .select("*")
    .eq("user_id", conta.userId)
    .maybeSingle();

  if (!conexao) {
    return NextResponse.json(
      { error: "Google Agenda ainda não conectado. Use o botão 'Conectar Google Agenda'." },
      { status: 400 }
    );
  }

  let accessToken = conexao.access_token;
  if (new Date(conexao.expires_at).getTime() <= Date.now() + 60_000) {
    try {
      const renovado = await refreshGoogleAccessToken(conexao.refresh_token);
      accessToken = renovado.accessToken;
      await supabase
        .from("google_calendar_conexao")
        .update({
          access_token: renovado.accessToken,
          expires_at: renovado.expiresAt.toISOString(),
        })
        .eq("id", conexao.id);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "falha ao renovar token do Google" },
        { status: 502 }
      );
    }
  }

  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - 7);
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 90);

  let eventos;
  try {
    eventos = await listGoogleCalendarEvents(accessToken, conexao.calendar_id, timeMin, timeMax);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "falha ao ler eventos do Google" },
      { status: 502 }
    );
  }

  const { data: pessoas } = await supabase
    .from("pessoa")
    .select("id")
    .eq("conta_id", conta.contaId)
    .order("created_at", { ascending: true })
    .limit(1);
  const pessoaTitularId = pessoas?.[0]?.id ?? null;

  const linhas = eventos
    .filter((e) => e.status !== "cancelled" && (e.start?.date || e.start?.dateTime))
    .map((e) => {
      const inicioDia = e.start!.date ?? e.start!.dateTime!.slice(0, 10);
      const hora = e.start!.dateTime ? e.start!.dateTime.slice(11, 16) : null;
      return {
        conta_id: conta.contaId,
        pessoa_id: pessoaTitularId,
        titulo: e.summary?.trim() || "(sem título)",
        data: inicioDia,
        hora,
        tipo: "pessoal" as const,
        gera_tarefa: false,
        google_event_id: e.id,
      };
    });

  if (linhas.length > 0) {
    const { error } = await supabase
      .from("compromisso")
      .upsert(linhas, { onConflict: "conta_id,google_event_id" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  await supabase
    .from("google_calendar_conexao")
    .update({ ultima_sincronizacao: new Date().toISOString() })
    .eq("id", conexao.id);

  return NextResponse.json({ sincronizados: linhas.length });
}
