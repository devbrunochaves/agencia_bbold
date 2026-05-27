-- ─── BBOLD Flow — Schema completo ─────────────────────────────────────────────
-- Rodar no SQL Editor do Supabase (https://supabase.com/dashboard/project/<id>/sql/new)

-- Extensão UUID
create extension if not exists "uuid-ossp";

-- ─── Clientes ──────────────────────────────────────────────────────────────────
create table if not exists clients (
  id            uuid        primary key default uuid_generate_v4(),
  name          text        not null,
  niche         text        default '',
  plan          text        default 'Growth',
  responsible   text        default '',
  status        text        default 'Ativo',
  contents      integer     default 10,
  initials      text        default '',
  color         text        default '#FFD22E',
  instagram     text        default '',
  whatsapp      text        default '',
  email         text        default '',
  observations  text        default '',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Conteúdos ─────────────────────────────────────────────────────────────────
create table if not exists contents (
  id            uuid        primary key default uuid_generate_v4(),
  title         text        not null,
  client        text        default '',
  format        text        default '',
  channel       text        default '',
  status        text        default 'Ideia',
  pub_date      date,
  pub_time      time,
  responsible   text        default '',
  priority      text        default 'Normal',
  copy          text        default '',
  observations  text        default '',
  link          text        default '',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Aprovações ────────────────────────────────────────────────────────────────
create table if not exists approvals (
  id            uuid        primary key default uuid_generate_v4(),
  title         text        not null,
  client        text        default '',
  format        text        default '',
  responsible   text        default '',
  deadline      date,
  priority      text        default 'Normal',
  status        text        default 'Pendente',
  copy          text        default '',
  observations  text        default '',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Biblioteca (arquivos) ─────────────────────────────────────────────────────
create table if not exists library (
  id            uuid        primary key default uuid_generate_v4(),
  name          text        not null,
  client        text        default '',
  subfolder     text        default '',
  type          text        default '',
  size_kb       integer     default 0,
  date          date,
  observations  text        default '',
  created_at    timestamptz default now()
);

-- ─── Subpastas da biblioteca ───────────────────────────────────────────────────
create table if not exists subfolders (
  id            uuid        primary key default uuid_generate_v4(),
  client        text        not null,
  name          text        not null,
  color         text        default '#FFD22E',
  created_at    timestamptz default now()
);

-- ─── Desabilitar RLS (sem autenticação ainda) ──────────────────────────────────
alter table clients    disable row level security;
alter table contents   disable row level security;
alter table approvals  disable row level security;
alter table library    disable row level security;
alter table subfolders disable row level security;

-- ─── Função para atualizar updated_at automaticamente ─────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_updated_at
  before update on clients
  for each row execute procedure update_updated_at();

create trigger contents_updated_at
  before update on contents
  for each row execute procedure update_updated_at();

create trigger approvals_updated_at
  before update on approvals
  for each row execute procedure update_updated_at();
