-- Añadir campo worked_day a work_logs
ALTER TABLE public.work_logs ADD COLUMN worked_day BOOLEAN DEFAULT false;

-- Actualizar registros históricos para que los días ya registrados consten como trabajados
UPDATE public.work_logs SET worked_day = true;
