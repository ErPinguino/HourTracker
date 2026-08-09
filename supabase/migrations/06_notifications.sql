-- Añadir ajustes de notificaciones a la tabla profiles
ALTER TABLE public.profiles ADD COLUMN notifications_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN daily_reminder_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN daily_reminder_time VARCHAR(5) DEFAULT '20:00';
ALTER TABLE public.profiles ADD COLUMN missing_days_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN month_end_enabled BOOLEAN DEFAULT false;
