-- Otimização de performance: embute o conta_id do usuário no JWT (via
-- app_metadata) na hora de emitir/renovar o token, em vez de consultar o
-- banco pra descobrir a conta em toda navegação. Depois de habilitado (via
-- API de Management, feito separadamente), getContaAtual() lê o conta_id
-- direto da sessão local (getSession(), sem rede) sempre que o claim já
-- estiver presente — só cai para RPC/consulta no primeiro login de cada
-- usuário, antes do token ainda não ter o claim.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_conta_id uuid;
  v_claims jsonb;
  v_app_metadata jsonb;
begin
  select conta_id into v_conta_id
  from conta_membro
  where user_id = (event->>'user_id')::uuid
  limit 1;

  v_claims := event->'claims';
  v_app_metadata := coalesce(v_claims->'app_metadata', '{}'::jsonb);

  if v_conta_id is not null then
    v_app_metadata := jsonb_set(v_app_metadata, '{conta_id}', to_jsonb(v_conta_id::text));
  end if;

  v_claims := jsonb_set(v_claims, '{app_metadata}', v_app_metadata);
  event := jsonb_set(event, '{claims}', v_claims);
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- o hook consulta conta_membro como supabase_auth_admin (não como o usuário
-- logado), então precisa de select direto, sem depender das policies de RLS
grant select on conta_membro to supabase_auth_admin;
