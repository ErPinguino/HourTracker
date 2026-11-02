import { normalizeTime, timeRegex } from './time.ts'

export function calculateWorkedMinutes(startTime: string, endTime: string, breakMinutes: number): number {
  startTime = normalizeTime(startTime)
  endTime = normalizeTime(endTime)
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime) || !Number.isFinite(breakMinutes) || breakMinutes < 0) return 0

  const [startHours, startMins] = startTime.split(':').map(Number)
  const [endHours, endMins] = endTime.split(':').map(Number)

  const startTotalMinutes = startHours * 60 + startMins
  const endTotalMinutes = endHours * 60 + endMins

  const worked = endTotalMinutes - startTotalMinutes - breakMinutes
  
  return Math.max(0, worked)
}
