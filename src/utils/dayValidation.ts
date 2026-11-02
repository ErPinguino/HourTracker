import { z } from 'zod'
import { normalizeTime, timeRegex } from './time.ts'
export const hourlySchema = z.object({
  start_time: z.string().transform(normalizeTime).pipe(z.string().regex(timeRegex, 'Formato inválido (HH:mm)')),
  end_time: z.string().transform(normalizeTime).pipe(z.string().regex(timeRegex, 'Formato inválido (HH:mm)')),
  break_minutes: z.number().min(0, 'El descanso no puede ser negativo'),
  notes: z.string().optional(),
  work_location: z.string().max(120, 'Máximo 120 caracteres').optional(),
}).refine(data => {
  if (!timeRegex.test(data.start_time) || !timeRegex.test(data.end_time)) return true
  return data.end_time > data.start_time
}, {
  message: 'La salida debe ser posterior a la entrada',
  path: ['end_time'],
}).refine(data => {
  if (!timeRegex.test(data.start_time) || !timeRegex.test(data.end_time) || data.end_time <= data.start_time) return true
  const [sh, sm] = data.start_time.split(':').map(Number)
  const [eh, em] = data.end_time.split(':').map(Number)
  const diffMins = (eh * 60 + em) - (sh * 60 + sm)
  return data.break_minutes < diffMins
}, {
  message: 'El descanso no puede superar la jornada',
  path: ['break_minutes'],
})

export const dailySchema = z.object({
  worked_day: z.boolean(),
  worked_extra: z.boolean(),
  extra_hours: z.number().optional(),
  notes: z.string().optional(),
  work_location: z.string().max(120, 'Máximo 120 caracteres').optional(),
}).refine(data => {
  if (!data.worked_day || !data.worked_extra) return true
  return (data.extra_hours ?? 0) > 0
}, {
  message: 'Indica las horas extra (mayor que 0)',
  path: ['extra_hours'],
})
