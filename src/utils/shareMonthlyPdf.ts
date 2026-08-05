import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { generateMonthlyPdf } from './generateMonthlyPdf'
import type { WorkLog, Profile } from '@/types'

export async function shareMonthlyPdf(month: Date, workLogs: WorkLog[], profile: Profile): Promise<void> {
  try {
    const doc = generateMonthlyPdf(month, workLogs, profile)
    
    const monthString = format(month, 'MMMM-yyyy', { locale: es })
    const fileName = `HourTrack-${monthString.charAt(0).toUpperCase() + monthString.slice(1)}.pdf`

    // Intento de compartir nativamente
    if (navigator.share && navigator.canShare) {
      try {
        const arrayBuffer = doc.output('arraybuffer')
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
        const file = new File([blob], fileName, { type: 'application/pdf', lastModified: Date.now() })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'HourTrack',
            text: 'Resumen mensual de jornada',
            files: [file],
          })
          return
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return // Cancelado por el usuario
        }
        // Si falla, caerá al fallback
      }
    }

    // Fallback: Descarga tradicional
    doc.save(fileName)
  } catch (error) {
    throw new Error('No se pudo generar el documento PDF. Inténtalo de nuevo.')
  }
}
