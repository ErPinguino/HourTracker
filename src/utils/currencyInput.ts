/**
 * Normalises a currency string typed by the user.
 * Accepts both Spanish (85,50) and standard (85.50) decimal formats.
 * Returns a finite number, or NaN if the input cannot be parsed.
 */
export function parseCurrencyInput(raw: string | number): number {
  if (typeof raw === 'number') return raw
  // Replace comma decimal separator with period
  const normalised = String(raw).trim().replace(',', '.')
  const parsed = parseFloat(normalised)
  // Round to 2 decimal places to avoid floating-point drift
  return isNaN(parsed) ? NaN : Math.round(parsed * 100) / 100
}

/**
 * react-hook-form setValueAs helper for currency fields.
 * Use with: register('field', { setValueAs: currencySetValueAs })
 */
export function currencySetValueAs(v: unknown): number {
  if (v === '' || v === null || v === undefined) return 0
  return parseCurrencyInput(String(v))
}

/**
 * Zod refinement: positive number, max 2 decimal places.
 */
export function currencyValidation(min = 0) {
  return {
    required: true,
    min,
    // Accepts up to 2 decimal places
    validate: (v: number) => {
      if (isNaN(v)) return 'Introduce un número válido'
      if (v < min) return `Debe ser mayor o igual a ${min}`
      if (!/^\d+(\.\d{1,2})?$/.test(String(Math.round(v * 100) / 100))) return 'Máximo 2 decimales'
      return true
    },
  }
}
