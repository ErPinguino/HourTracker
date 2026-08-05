import jsPDF from 'jspdf'
import type { WorkLog, Profile } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatWorkedMinutes } from './formatWorkedMinutes'
import { calculatePayroll } from './calculatePayroll'

export function generateMonthlyPdf(month: Date, workLogs: WorkLog[], profile: Profile) {
  const doc = new jsPDF()
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const centerX = pageWidth / 2
  const marginLeft = 24
  const rightMargin = pageWidth - 24
  
  const colorBlue = [10, 132, 255] as [number, number, number]
  const colorDarkGray = [17, 24, 39] as [number, number, number]
  const colorMidGray = [107, 114, 128] as [number, number, number]
  const colorLightGray = [156, 163, 175] as [number, number, number]
  const colorDivider = [229, 231, 235] as [number, number, number]

  const paymentType = profile.payment_type ?? 'hourly'

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'decimal', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(val) + ' ' + profile.currency
  }

  const sortedLogs = [...workLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const payroll = calculatePayroll(sortedLogs, profile)

  // Columnas de la tabla varían según el tipo de trabajador
  const colDia = marginLeft
  let colA: number, colB: number, colC: number, headerA: string, headerB: string, headerC: string

  if (paymentType === 'daily') {
    colA = marginLeft + 35
    colB = marginLeft + 90
    colC = rightMargin
    headerA = 'Jornal'
    headerB = 'Extra'
    headerC = 'Total'
  } else {
    colA = marginLeft + 35
    colB = marginLeft + 95
    colC = rightMargin
    headerA = 'Jornada'
    headerB = 'Total'
    headerC = 'Ganado'
  }

  const drawPageHeader = (d: typeof doc, isFirstPage: boolean) => {
    let y = 35
    
    d.setFontSize(24)
    d.setFont('helvetica', 'bold')
    d.setTextColor(...colorBlue)
    d.text('HourTrack', centerX, y, { align: 'center' })
    
    y += 10
    d.setFontSize(14)
    d.setFont('helvetica', 'normal')
    d.setTextColor(...colorMidGray)
    d.text(profile.worker_name || 'Trabajador', centerX, y, { align: 'center' })
    
    y += 10
    d.setFontSize(12)
    d.text('Resumen mensual', centerX, y, { align: 'center' })
    
    y += 12
    const monthString = format(month, 'MMMM yyyy', { locale: es })
    const capitalizedMonth = monthString.charAt(0).toUpperCase() + monthString.slice(1)
    d.setFontSize(18)
    d.setFont('helvetica', 'bold')
    d.setTextColor(...colorDarkGray)
    d.text(capitalizedMonth, centerX, y, { align: 'center' })
    
    y += 24

    if (isFirstPage && sortedLogs.length > 0) {
      d.setFontSize(11)
      d.setFont('helvetica', 'bold')
      d.setTextColor(...colorMidGray)
      d.text('TOTAL GANADO', centerX, y, { align: 'center' })
      
      y += 18
      d.setFontSize(40)
      d.setFont('helvetica', 'bold')
      d.setTextColor(...colorBlue)
      d.text(formatCurrency(payroll.totalPay), centerX, y, { align: 'center' })
      
      y += 12
      d.setFontSize(12)
      d.setFont('helvetica', 'normal')
      d.setTextColor(...colorMidGray)

      let extraInfo: string
      if (paymentType === 'daily') {
        const extraStr = payroll.totalExtraHours > 0 ? ` • ${payroll.totalExtraHours}h extra` : ''
        extraInfo = `${payroll.totalJornales} jornales${extraStr}`
      } else {
        extraInfo = `${formatWorkedMinutes(payroll.regularMinutes)} normales • ${formatWorkedMinutes(payroll.overtimeMinutes)} extras`
      }
      d.text(extraInfo, centerX, y, { align: 'center' })
      
      y += 28
      
      d.setFontSize(10)
      d.setFont('helvetica', 'normal')
      d.setTextColor(...colorLightGray)
      
      const col1 = pageWidth * 0.25
      const col2 = pageWidth * 0.50
      const col3 = pageWidth * 0.75

      if (paymentType === 'daily') {
        d.text('Jornales', col1, y, { align: 'center' })
        d.text('Horas extra', col2, y, { align: 'center' })
        d.text('Total', col3, y, { align: 'center' })

        y += 8
        d.setFontSize(14)
        d.setFont('helvetica', 'bold')
        d.setTextColor(...colorDarkGray)
        d.text(payroll.totalJornales.toString(), col1, y, { align: 'center' })
        d.text(payroll.totalExtraHours > 0 ? `${payroll.totalExtraHours}h` : '—', col2, y, { align: 'center' })
        d.text(formatCurrency(payroll.totalPay), col3, y, { align: 'center' })
      } else {
        d.text('Días trabajados', col1, y, { align: 'center' })
        d.text('Horas normales', col2, y, { align: 'center' })
        d.text('Horas extra', col3, y, { align: 'center' })

        y += 8
        d.setFontSize(14)
        d.setFont('helvetica', 'bold')
        d.setTextColor(...colorDarkGray)
        d.text(payroll.workedDays.toString(), col1, y, { align: 'center' })
        d.text(formatWorkedMinutes(payroll.regularMinutes), col2, y, { align: 'center' })
        d.text(formatWorkedMinutes(payroll.overtimeMinutes), col3, y, { align: 'center' })
      }
      
      y += 30
    } else if (!isFirstPage) {
      y += 15
    }

    if (sortedLogs.length > 0) {
      d.setFontSize(10)
      d.setFont('helvetica', 'bold')
      d.setTextColor(...colorMidGray)
      
      d.text('Día', colDia, y)
      d.text(headerA, colA, y)
      d.text(headerB, colB, y)
      d.text(headerC, colC, y, { align: 'right' })
      
      y += 6
      d.setDrawColor(...colorDivider)
      d.setLineWidth(0.5)
      d.line(marginLeft, y, rightMargin, y)
      y += 16
    }
    
    return y
  }

  const drawFooter = (d: typeof doc) => {
    d.setFontSize(8)
    d.setFont('helvetica', 'normal')
    d.setTextColor(...colorLightGray)
    const footerText = `HourTrack — Generado el ${format(new Date(), 'dd/MM/yyyy')}`
    d.text(footerText, centerX, pageHeight - 15, { align: 'center' })
  }

  let y = drawPageHeader(doc, true)

  if (sortedLogs.length === 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...colorMidGray)
    doc.text('No existen registros para este mes.', centerX, y + 20, { align: 'center' })
    drawFooter(doc)
    return doc
  }

  doc.setFontSize(10)

  sortedLogs.forEach(log => {
    if (y > pageHeight - 40) {
      drawFooter(doc)
      doc.addPage()
      y = drawPageHeader(doc, false)
      doc.setFontSize(10)
    }

    const dateObj = new Date(`${log.date}T12:00:00`)
    const dateStr = format(dateObj, 'dd MMM', { locale: es })
    const capitalizedDateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colorMidGray)
    doc.text(capitalizedDateStr, colDia, y)

    if (paymentType === 'daily') {
      const hasWorked = log.worked_day !== false
      
      // Col A: Jornal base
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colorMidGray)
      doc.text(hasWorked ? formatCurrency(profile.daily_rate ?? 0) : '—', colA, y)

      // Col B: Horas extra
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colorDarkGray)
      const extraText = hasWorked && log.worked_extra && (log.extra_hours ?? 0) > 0
        ? `+${log.extra_hours}h`
        : '—'
      doc.text(extraText, colB, y)

      // Col C: Total del día
      const dailyTotal = hasWorked ? (profile.daily_rate ?? 0) + ((log.worked_extra ? log.extra_hours ?? 0 : 0) * (profile.overtime_rate ?? 0)) : 0
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colorDarkGray)
      doc.text(formatCurrency(dailyTotal), colC, y, { align: 'right' })
    } else {
      // Col A: Jornada horaria
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colorMidGray)
      doc.text(`${log.start_time?.slice(0, 5) || ''} - ${log.end_time?.slice(0, 5) || ''}`, colA, y)

      // Col B: Total horas
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colorDarkGray)
      doc.text(formatWorkedMinutes(log.worked_minutes), colB, y)

      // Col C: Ganado
      const dailyPayroll = calculatePayroll([log], profile)
      doc.setTextColor(...colorMidGray)
      doc.text(formatCurrency(dailyPayroll.totalPay), colC, y, { align: 'right' })
    }

    y += 16
  })

  if (y > pageHeight - 80) {
    drawFooter(doc)
    doc.addPage()
    y = drawPageHeader(doc, false)
  }

  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...colorBlue)
  doc.text('RESUMEN ECONÓMICO', centerX, y, { align: 'center' })

  y += 16

  if (paymentType === 'daily') {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...colorMidGray)
    doc.text('Jornales base', marginLeft, y)
    doc.text(`${payroll.totalJornales} jornales`, centerX, y, { align: 'center' })
    doc.setTextColor(...colorDarkGray)
    doc.text(formatCurrency(payroll.jornadaPay), rightMargin, y, { align: 'right' })

    y += 14

    doc.setTextColor(...colorMidGray)
    doc.text('Horas extra', marginLeft, y)
    doc.text(payroll.totalExtraHours > 0 ? `${payroll.totalExtraHours}h` : '—', centerX, y, { align: 'center' })
    doc.setTextColor(...colorDarkGray)
    doc.text(formatCurrency(payroll.overtimePay), rightMargin, y, { align: 'right' })
  } else {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...colorMidGray)
    doc.text('Horas normales', marginLeft, y)
    doc.text(formatWorkedMinutes(payroll.regularMinutes), centerX, y, { align: 'center' })
    doc.setTextColor(...colorDarkGray)
    doc.text(formatCurrency(payroll.regularPay), rightMargin, y, { align: 'right' })

    y += 14

    doc.setTextColor(...colorMidGray)
    doc.text('Horas extra', marginLeft, y)
    doc.text(formatWorkedMinutes(payroll.overtimeMinutes), centerX, y, { align: 'center' })
    doc.setTextColor(...colorDarkGray)
    doc.text(formatCurrency(payroll.overtimePay), rightMargin, y, { align: 'right' })
  }

  y += 14

  doc.setDrawColor(...colorBlue)
  doc.setLineWidth(1.0)
  doc.line(marginLeft, y, rightMargin, y)
  
  y += 16

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...colorDarkGray)
  doc.text('TOTAL GANADO', marginLeft, y)
  
  doc.setFontSize(16)
  doc.setTextColor(...colorBlue)
  doc.text(formatCurrency(payroll.totalPay), rightMargin, y, { align: 'right' })
  
  drawFooter(doc)
  return doc
}
