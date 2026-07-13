import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getContaAtual } from "@/lib/conta";
import { BASE_PATH } from "@/lib/basePath";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? BASE_PATH;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Se essa troca veio de um fluxo que pediu escopo do Google Calendar
      // (ver /agenda "Conectar Google Agenda"), o Google devolve tokens de
      // acesso próprios do provedor — salva pra poder ler a agenda depois.
      if (data.session?.provider_token && data.session?.provider_refresh_token) {
        const conta = await getContaAtual();
        if (conta) {
          await supabase.from("google_calendar_conexao").upsert(
            {
              conta_id: conta.contaId,
              user_id: conta.userId,
              access_token: data.session.provider_token,
              refresh_token: data.session.provider_refresh_token,
              expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            },
            { onConflict: "user_id" }
          );
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}${BASE_PATH}/login`);
}
