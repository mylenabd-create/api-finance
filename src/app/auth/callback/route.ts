import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BASE_PATH } from "@/lib/basePath";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? BASE_PATH;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Cria a conta (primeiro login) ou corrige o nome da pessoa titular se
      // ainda estiver genérico — só roda aqui, uma vez por login (ver
      // src/lib/conta.ts, que usa o caminho rápido via JWT em toda navegação
      // seguinte, sem chamar isso de novo).
      const { data: bootstrap } = await supabase.rpc("bootstrap_conta");

      // Se essa troca veio de um fluxo que pediu escopo do Google Calendar
      // (ver /agenda "Conectar Google Agenda"), o Google devolve tokens de
      // acesso próprios do provedor — salva pra poder ler a agenda depois.
      if (bootstrap?.conta_id && data.session?.provider_token && data.session?.provider_refresh_token) {
        await supabase.from("google_calendar_conexao").upsert(
          {
            conta_id: bootstrap.conta_id,
            user_id: data.user.id,
            access_token: data.session.provider_token,
            refresh_token: data.session.provider_refresh_token,
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          },
          { onConflict: "user_id" }
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}${BASE_PATH}/login`);
}
