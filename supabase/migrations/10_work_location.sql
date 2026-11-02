-- Ubicación opcional de la jornada. Compatible con registros existentes.
ALTER TABLE public.work_logs
  ADD COLUMN IF NOT EXISTS work_location TEXT;
