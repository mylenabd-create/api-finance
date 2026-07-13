-- Usa o nome real do login (Google: given_name/full_name; e-mail: parte antes do @)
-- em vez do genérico "Você" — tanto na criação da conta quanto corrigindo
-- retroativamente contas que já foram criadas com o nome genérico.

create or replace function public.bootstrap_conta()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_conta_id uuid;
  v_meta jsonb;
  v_email text;
  v_nome text;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select raw_user_meta_data, email into v_meta, v_email
  from auth.users where id = v_user_id;

  v_nome := coalesce(
    nullif(trim(split_part(
      coalesce(v_meta->>'given_name', v_meta->>'full_name', v_meta->>'name', ''),
      ' ', 1
    )), ''),
    nullif(initcap(split_part(coalesce(v_email, ''), '@', 1)), ''),
    'Você'
  );

  select conta_id into v_conta_id
  from conta_membro
  where user_id = v_user_id
  limit 1;

  if v_conta_id is not null then
    -- corrige retroativamente a pessoa titular se ainda estiver com o nome genérico
    update pessoa
    set nome = v_nome
    where conta_id = v_conta_id and nome = 'Você' and v_nome <> 'Você';

    return json_build_object('conta_id', v_conta_id);
  end if;

  insert into conta (nome) values ('Minha família') returning id into v_conta_id;
  insert into conta_membro (conta_id, user_id, papel) values (v_conta_id, v_user_id, 'dono');
  insert into pessoa (conta_id, nome, cor) values (v_conta_id, v_nome, '#C9A15E');

  return json_build_object('conta_id', v_conta_id);
end;
$$;
