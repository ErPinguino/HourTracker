-- Añadir columna de tema a la tabla profiles
alter table public.profiles
  add column theme text not null default 'system';
