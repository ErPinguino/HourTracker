-- Crear la tabla profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  daily_goal_minutes integer not null default 480,
  default_break_minutes integer not null default 30,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activar RLS (Row Level Security)
alter table public.profiles enable row level security;

-- Crear políticas de seguridad
create policy "Usuarios pueden ver su propio perfil"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Usuarios pueden insertar su propio perfil"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Usuarios pueden actualizar su propio perfil"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
