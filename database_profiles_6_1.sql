-- Añadir nuevas columnas a la tabla profiles existente
alter table public.profiles
  add column hourly_rate numeric not null default 0,
  add column overtime_rate numeric not null default 0,
  add column overtime_after_minutes integer not null default 480,
  add column currency text not null default '€';
