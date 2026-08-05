export function formatWorkedMinutes(minutes: number): string {
  if (minutes <= 0) return '0 min'

  const h = Math.floor(minutes / 60)
  const m = minutes % 60

  if (h > 0 && m > 0) {
    return `${h} h ${m} min`
  }
  
  if (h > 0) {
    return `${h} h`
  }

  return `${m} min`
}
