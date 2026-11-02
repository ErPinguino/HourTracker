/** Native time values and PostgreSQL times share a minute-precision form. */
export function normalizeTime(value: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::00(?:\.0+)?)?$/.exec(value.trim())
  return match ? `${match[1]}:${match[2]}` : value.trim()
}

export const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
