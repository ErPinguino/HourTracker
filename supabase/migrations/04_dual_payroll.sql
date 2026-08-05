-- Migración: Dual Payroll Engine (Fase 12)
-- Añade soporte para trabajadores por jornal y horas extra puras

-- Modificaciones en la tabla PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'hourly' CHECK (payment_type IN ('hourly', 'daily')),
ADD COLUMN IF NOT EXISTS daily_rate numeric DEFAULT 0;

-- Modificaciones en la tabla WORK_LOGS
ALTER TABLE public.work_logs 
ADD COLUMN IF NOT EXISTS worked_extra boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS extra_hours numeric DEFAULT 0;

-- Opcionalmente, permitir que start_time, end_time y break_minutes sean null o tengan valores por defecto seguros para los jornales diarios
-- No alteramos constraints de not null si no los tienen, pero para que sea retrocompatible asumimos que las aplicaciones enviarán valores vacíos o default.
