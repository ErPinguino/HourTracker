-- Añadir la columna de días activos para el recordatorio diario en la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_reminder_days SMALLINT[] DEFAULT '{1,2,3,4,5}';
