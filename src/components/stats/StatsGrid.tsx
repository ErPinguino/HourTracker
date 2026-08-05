import { formatWorkedMinutes } from '@/utils/formatWorkedMinutes'
import type { PayrollResult } from '@/utils/calculatePayroll'

interface StatsGridProps {
  stats: PayrollResult
  currency: string
}

export function StatsGrid({ stats, currency }: StatsGridProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'decimal', minimumFractionDigits: 2 }).format(val) + ' ' + currency
  }

  const StatRow = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div className="grouped-list-item flex justify-between items-center py-3.5 px-4 bg-[var(--card-bg)]">
      <span className="text-[17px] text-gray-900 dark:text-white">{label}</span>
      <span className={`text-[17px] ${highlight ? 'text-blue-600 dark:text-blue-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
        {value}
      </span>
    </div>
  )

  if (stats.paymentType === 'daily') {
    return (
      <div className="flex flex-col space-y-8 w-full pb-10">
        
        {/* Featured Card */}
        <div className="bg-gradient-to-br from-gray-900 to-black dark:from-[#1c1c1e] dark:to-[#121212] rounded-[2rem] p-8 flex flex-col items-center justify-center text-white shadow-xl transform transition-all relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-gray-400 text-[13px] font-semibold tracking-wider uppercase mb-2">Ganado este mes</span>
            <span className="text-[3.5rem] leading-none font-extrabold tracking-tight mb-2">{formatCurrency(stats.totalPay)}</span>
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          
          {/* Jornales */}
          <section>
            <h3 className="text-premium-label mb-2 px-4">Jornadas</h3>
            <div className="premium-card overflow-hidden">
              <StatRow label="Jornales registrados" value={stats.totalJornales.toString()} />
              <StatRow label="Horas extra" value={stats.totalExtraHours > 0 ? `${stats.totalExtraHours}h` : '—'} />
            </div>
          </section>

          {/* Salario */}
          <section>
            <h3 className="text-premium-label mb-2 px-4">Salario</h3>
            <div className="premium-card overflow-hidden">
              <StatRow label="Base (jornales)" value={formatCurrency(stats.jornadaPay)} />
              <StatRow label="Extra" value={formatCurrency(stats.overtimePay)} />
            </div>
          </section>

        </div>
      </div>
    )
  }

  // Modo Horas
  const balancePrefix = stats.balanceMinutes > 0 ? '+' : (stats.balanceMinutes < 0 ? '-' : '')
  const formattedBalance = formatWorkedMinutes(Math.abs(stats.balanceMinutes))

  return (
    <div className="flex flex-col space-y-8 w-full pb-10">
      
      {/* Featured Card */}
      <div className="bg-gradient-to-br from-gray-900 to-black dark:from-[#1c1c1e] dark:to-[#121212] rounded-[2rem] p-8 flex flex-col items-center justify-center text-white shadow-xl transform transition-all relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-gray-400 text-[13px] font-semibold tracking-wider uppercase mb-2">Total ganado</span>
          <span className="text-[3.5rem] leading-none font-extrabold tracking-tight mb-2">{formatCurrency(stats.totalPay)}</span>
        </div>
      </div>

      <div className="flex flex-col space-y-6">
        
        {/* Salario */}
        <section>
          <h3 className="text-premium-label mb-2 px-4">Salario</h3>
          <div className="premium-card overflow-hidden">
            <StatRow label="Normal" value={formatCurrency(stats.regularPay)} />
            <StatRow label="Extra" value={formatCurrency(stats.overtimePay)} />
          </div>
        </section>

        {/* Trabajo */}
        <section>
          <h3 className="text-premium-label mb-2 px-4">Trabajo</h3>
          <div className="premium-card overflow-hidden">
            <StatRow label="Total horas" value={formatWorkedMinutes(stats.totalWorkedMinutes)} />
            <StatRow label="Horas normales" value={formatWorkedMinutes(stats.regularMinutes)} />
            <StatRow label="Horas extra" value={formatWorkedMinutes(stats.overtimeMinutes)} />
            <StatRow label="Media diaria" value={formatWorkedMinutes(stats.averageMinutes)} />
            <StatRow label="Jornada más larga" value={formatWorkedMinutes(stats.longestDay)} />
            <StatRow label="Días trabajados" value={stats.workedDays.toString()} />
          </div>
        </section>

        {/* Balance */}
        <section>
          <h3 className="text-premium-label mb-2 px-4">Objetivos</h3>
          <div className="premium-card overflow-hidden">
            <StatRow 
              label="Balance mensual" 
              value={`${balancePrefix}${formattedBalance}`} 
              highlight={stats.balanceMinutes !== 0} 
            />
          </div>
        </section>

      </div>
    </div>
  )
}
