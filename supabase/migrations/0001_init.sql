-- Gestor de Vida — schema inicial (seção 3 do PROJECT_BRIEF)
-- Rode este arquivo no SQL Editor do seu projeto Supabase (ou via `supabase db push`).

create extension if not exists "pgcrypto";

-- ========== CONTA / PESSOA ==========

create table conta (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

-- liga usuários do Supabase Auth a uma conta (permite uso familiar: vários logins, uma conta)
create table conta_membro (
  conta_id uuid not null references conta(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel text not null default 'membro' check (papel in ('dono', 'membro')),
  created_at timestamptz not null default now(),
  primary key (conta_id, user_id)
);

create table pessoa (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  nome text not null,
  cor text not null default '#C9A15E',
  created_at timestamptz not null default now()
);

-- ========== FINANÇAS ==========

create table categoria (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  nome text not null,
  cor text not null default '#8C97A3',
  icone text,
  created_at timestamptz not null default now()
);

create table meta (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  categoria_id uuid not null references categoria(id) on delete cascade,
  tipo text not null check (tipo in ('percentual', 'valor')),
  valor numeric(12,2) not null,
  mes_referencia date not null, -- sempre dia 1 do mês
  created_at timestamptz not null default now()
);

create table cartao (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  banco text not null,
  bandeira text not null,
  final text not null,
  limite_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table fatura (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  cartao_id uuid not null references cartao(id) on delete cascade,
  mes_referencia date not null,
  fechamento date not null,
  vencimento date not null,
  created_at timestamptz not null default now(),
  unique (cartao_id, mes_referencia)
);

create table transacao (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  descricao text not null,
  valor numeric(12,2) not null,
  data date not null,
  categoria_id uuid references categoria(id) on delete set null,
  pessoa_id uuid references pessoa(id) on delete set null,
  fatura_id uuid references fatura(id) on delete set null,
  origem text not null default 'manual' check (origem in ('manual', 'ia_texto', 'ia_audio', 'ia_imagem', 'ia_documento')),
  created_at timestamptz not null default now()
);

create table receita (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  fonte text not null,
  valor numeric(12,2) not null,
  pessoa_id uuid references pessoa(id) on delete set null,
  recorrente boolean not null default false,
  data date not null default current_date,
  created_at timestamptz not null default now()
);

create table lancamento_futuro (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  descricao text not null,
  valor numeric(12,2) not null,
  tipo text not null check (tipo in ('recorrente', 'parcelado', 'projetado')),
  fluxo text not null check (fluxo in ('receita', 'despesa')),
  data_inicio date not null,
  data_fim date,
  created_at timestamptz not null default now()
);

-- ========== HÁBITOS & CORPO ==========

create table habito (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  pessoa_id uuid not null references pessoa(id) on delete cascade,
  nome text not null,
  cor text not null default '#5B9C93',
  created_at timestamptz not null default now()
);

create table habito_registro (
  id uuid primary key default gen_random_uuid(),
  habito_id uuid not null references habito(id) on delete cascade,
  data date not null,
  concluido boolean not null default true,
  created_at timestamptz not null default now(),
  unique (habito_id, data)
);

create table avaliacao_bioimpedancia (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  pessoa_id uuid not null references pessoa(id) on delete cascade,
  data date not null,
  peso numeric(5,2),
  altura numeric(4,2),
  gordura numeric(5,2),
  massa_muscular numeric(5,2),
  agua numeric(5,2),
  created_at timestamptz not null default now()
);

create table registro_sono (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  pessoa_id uuid not null references pessoa(id) on delete cascade,
  data date not null,
  hora_dormiu time,
  hora_acordou time,
  created_at timestamptz not null default now()
);

create table treino (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  pessoa_id uuid not null references pessoa(id) on delete cascade,
  tipo text not null,
  duracao integer not null default 0, -- minutos
  data date not null,
  created_at timestamptz not null default now()
);

-- ========== AGENDA & TEMPO ==========

create table compromisso (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  pessoa_id uuid references pessoa(id) on delete set null,
  titulo text not null,
  data date not null,
  hora time,
  tipo text not null check (tipo in ('trabalho', 'pessoal', 'pagamento', 'saude')),
  gera_tarefa boolean not null default false,
  google_event_id text,
  created_at timestamptz not null default now()
);

create table tarefa (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  pessoa_id uuid references pessoa(id) on delete set null,
  titulo text not null,
  prazo date,
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  status text not null default 'afazer' check (status in ('afazer', 'andamento', 'concluida')),
  atrasada boolean not null default false,
  origem text not null default 'manual' check (origem in ('manual', 'calendario')),
  compromisso_id uuid references compromisso(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ========== ESPIRITUAL & LEITURA ==========

create table pratica_espiritual (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  pessoa_id uuid not null references pessoa(id) on delete cascade,
  data date not null,
  created_at timestamptz not null default now(),
  unique (pessoa_id, data)
);

create table livro (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  pessoa_id uuid not null references pessoa(id) on delete cascade,
  titulo text not null,
  autor text,
  progresso numeric(5,2) not null default 0, -- 0 a 100
  atual boolean not null default false,
  created_at timestamptz not null default now()
);

-- ========== LEMBRETES ==========

create table lembrete (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references conta(id) on delete cascade,
  pessoa_id uuid references pessoa(id) on delete set null,
  texto text not null,
  tipo text not null check (tipo in ('pagamento', 'habito', 'compromisso', 'tarefa')),
  data_disparo timestamptz not null,
  dispensado boolean not null default false,
  created_at timestamptz not null default now()
);

-- ========== ÍNDICES ==========

create index on transacao (conta_id, data);
create index on transacao (fatura_id);
create index on receita (conta_id, data);
create index on fatura (cartao_id, mes_referencia);
create index on habito_registro (habito_id, data);
create index on compromisso (conta_id, data);
create index on tarefa (conta_id, status);
create index on lembrete (conta_id, dispensado);

-- ========== ROW LEVEL SECURITY ==========

alter table conta enable row level security;
alter table conta_membro enable row level security;
alter table pessoa enable row level security;
alter table categoria enable row level security;
alter table meta enable row level security;
alter table cartao enable row level security;
alter table fatura enable row level security;
alter table transacao enable row level security;
alter table receita enable row level security;
alter table lancamento_futuro enable row level security;
alter table habito enable row level security;
alter table habito_registro enable row level security;
alter table avaliacao_bioimpedancia enable row level security;
alter table registro_sono enable row level security;
alter table treino enable row level security;
alter table compromisso enable row level security;
alter table tarefa enable row level security;
alter table pratica_espiritual enable row level security;
alter table livro enable row level security;
alter table lembrete enable row level security;

-- helper: contas às quais o usuário logado pertence
create or replace function minhas_contas()
returns setof uuid
language sql
security definer
stable
as $$
  select conta_id from conta_membro where user_id = auth.uid();
$$;

create policy "membro ve sua conta" on conta
  for select using (id in (select minhas_contas()));
create policy "usuario autenticado cria conta" on conta
  for insert with check (auth.uid() is not null);
create policy "dono atualiza conta" on conta
  for update using (
    id in (select conta_id from conta_membro where user_id = auth.uid() and papel = 'dono')
  );

create policy "membro ve membros da sua conta" on conta_membro
  for select using (conta_id in (select minhas_contas()));
create policy "membro se adiciona via convite (insert controlado por API)" on conta_membro
  for insert with check (user_id = auth.uid());

-- política genérica: acesso total (select/insert/update/delete) a linhas da própria conta
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'pessoa','categoria','meta','cartao','fatura','transacao','receita',
      'lancamento_futuro','habito','avaliacao_bioimpedancia','registro_sono',
      'treino','compromisso','tarefa','pratica_espiritual','livro','lembrete'
    ])
  loop
    execute format(
      'create policy "acesso por conta" on %I for all using (conta_id in (select minhas_contas())) with check (conta_id in (select minhas_contas()))',
      t
    );
  end loop;
end $$;

-- habito_registro não tem conta_id direto: RLS via join com habito
create policy "acesso por conta via habito" on habito_registro
  for all
  using (habito_id in (select id from habito where conta_id in (select minhas_contas())))
  with check (habito_id in (select id from habito where conta_id in (select minhas_contas())));
