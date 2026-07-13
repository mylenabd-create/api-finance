-- Conexão opcional com o Google Calendar (seção 9 do brief) — separada do
-- login. Guarda os tokens OAuth do usuário para poder ler (e futuramente
-- criar) eventos. RLS restringe cada linha ao próprio usuário dono do token.

create table google_calendar_conexao (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  pessoa_id uuid references pessoa(id) on delete set null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  calendar_id text not null default 'primary',
  ultima_sincronizacao timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table google_calendar_conexao enable row level security;

create policy "usuario ve e gerencia sua propria conexao" on google_calendar_conexao
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and conta_id in (select minhas_contas()));
