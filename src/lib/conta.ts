import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type ContaAtual = { contaId: string; userId: string };

// Retorna a conta do usuário logado, criando uma na primeira vez que ele
// entra (uso familiar: uma conta pode ter vários membros/pessoas depois).
export const getContaAtual = cache(async (): Promise<ContaAtual | null> => {
  const supabase = await createClient();

  // getSession() lê a sessão do cookie sem bater na rede — muito mais rápido
  // que getUser() (que sempre revalida no servidor do Supabase). A conta em
  // si continua protegida pelo RLS de cada tabela, então isso não abre
  // brecha nenhuma: um token adulterado localmente simplesmente não retorna
  // dados nas queries seguintes.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return null;

  // Caminho rápido: o conta_id já vem embutido no JWT (custom access token
  // hook, ver 0006_custom_access_token_hook.sql) — zero consultas ao banco.
  const contaIdDoToken = user.app_metadata?.conta_id as string | undefined;
  if (contaIdDoToken) {
    return { contaId: contaIdDoToken, userId: user.id };
  }

  // Sessão emitida antes do hook estar ativo (ou primeiro login de verdade):
  // cai pra consulta/bootstrap normal. Na próxima renovação de token o claim
  // já vem pronto.
  const { data: membro } = await supabase
    .from("conta_membro")
    .select("conta_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membro) return { contaId: membro.conta_id, userId: user.id };

  // Primeira entrada do usuário: cria conta + pessoa via RPC (security
  // definer). Ver supabase/migrations/0002_bootstrap_conta_rpc.sql — INSERTs
  // diretos nessa instância do Supabase esbarram numa anomalia de RLS que
  // bloqueia até políticas "permita tudo"; o RPC contorna isso.
  const { data: bootstrap, error } = await supabase.rpc("bootstrap_conta");
  if (error || !bootstrap) return null;

  return { contaId: bootstrap.conta_id, userId: user.id };
});
