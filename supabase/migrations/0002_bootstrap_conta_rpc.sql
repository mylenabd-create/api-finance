-- Workaround para uma anomalia da instância Postgres deste projeto Supabase:
-- INSERTs diretos (via REST/PostgREST) em tabelas com RLS estão sendo
-- bloqueados com "42501 new row violates row-level security policy" mesmo
-- com políticas `with check (true)` — reproduzido também via SQL puro,
-- fora do PostgREST, para os papéis `anon` e `authenticated`. Chamadas RPC
-- (funções), por outro lado, funcionam normalmente. Este RPC cria a conta
-- inicial do usuário (uso familiar) rodando como `security definer`
-- (dono da função = postgres, que tem BYPASSRLS), contornando o bug.
--
-- Reportar ao suporte do Supabase se isso ainda for necessário depois que
-- o bug de RLS for corrigido na instância.

create or replace function public.bootstrap_conta()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_conta_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select conta_id into v_conta_id
  from conta_membro
  where user_id = v_user_id
  limit 1;

  if v_conta_id is not null then
    return json_build_object('conta_id', v_conta_id);
  end if;

  insert into conta (nome) values ('Minha família') returning id into v_conta_id;
  insert into conta_membro (conta_id, user_id, papel) values (v_conta_id, v_user_id, 'dono');
  insert into pessoa (conta_id, nome, cor) values (v_conta_id, 'Você', '#C9A15E');

  return json_build_object('conta_id', v_conta_id);
end;
$$;

grant execute on function public.bootstrap_conta() to authenticated;
