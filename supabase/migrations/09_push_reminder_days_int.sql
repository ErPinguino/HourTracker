-- Recrear la columna daily_reminder_days para que sea un array de enteros puros compatibles con Javascript (0-6)
ALTER TABLE public.profiles DROP COLUMN daily_reminder_days;
ALTER TABLE public.profiles ADD COLUMN daily_reminder_days INTEGER[] DEFAULT '{1,2,3,4,5}';
