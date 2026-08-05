import { toBlob } from 'html-to-image'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export async function shareMonthlyImage(node: HTMLElement, month: Date): Promise<void> {
  try {
    const monthString = format(month, 'MMMM-yyyy', { locale: es })
    const fileName = `HourTrack-${monthString.charAt(0).toUpperCase() + monthString.slice(1)}.png`

    const blob = await toBlob(node, {
      pixelRatio: 1,
      backgroundColor: '#F5F5F7',
      style: {
        transform: 'scale(1)',
        opacity: '1'
      }
    })

    if (!blob) throw new Error('No se pudo generar la imagen')

    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], fileName, { type: 'image/png', lastModified: Date.now() })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'HourTrack',
            text: 'Resumen mensual de jornada',
            files: [file],
          })
          return
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
      }
    }

    // Fallback: Descarga directa
    downloadBlob(blob, fileName)
  } catch (error) {
    throw new Error('No se pudo generar la imagen. Inténtalo de nuevo.')
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
