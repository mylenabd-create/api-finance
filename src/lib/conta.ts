import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type ContaAtual = { contaId: string; userId: string };

// Retorna a conta do usuário logado, criando uma na primeira vez que ele
// entra (uso familiar: uma conta pode ter vários membros/pessoas depois).
export const getContaAtual = cache(async (): Promise<ContaAtual | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

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
