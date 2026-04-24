import NumberFlow, { type Format } from '@number-flow/react'
import { Link } from '@tanstack/react-router'

type MonthCardProps = {
  month: string
  income: number
  expenses: number
  balance: number
  isCurrent?: boolean
  isPast?: boolean
  isLoading?: boolean
}

function formatMonthLabel(month: string) {
  const [year, mon] = month.split('-').map(Number)
  return new Date(year, mon - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

const currencyFormat: Format = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }

export function MonthCard({ month, income, expenses, balance, isCurrent, isPast, isLoading }: MonthCardProps) {
  const savingsPct = income > 0 ? Math.max(0, Math.min(balance / income, 1)) * 100 : 0
  const positive = balance > 0
  const balanceClass = balance > 0 ? 'text-green-600 dark:text-green-400 font-medium' : balance < 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-zinc-500 dark:text-zinc-400 font-medium'
  return (
    <Link
      to="/month/$month"
      params={{ month }}
      className={`group relative block rounded-xl border p-4 overflow-hidden transition-colors ${isPast ? 'border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
    >
      <div
        className="absolute inset-y-0 left-0 pointer-events-none transition-all duration-500 ease-in-out"
        style={{
          width: `${!isLoading && savingsPct > 0 ? savingsPct : 0}%`,
          opacity: !isLoading && savingsPct > 0 ? 1 : 0,
          backgroundColor: positive ? 'rgb(34 197 94 / 0.07)' : 'rgb(239 68 68 / 0.07)',
        }}
      />
      {/* mobile: two rows */}
      <div className="flex justify-between items-center sm:hidden">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isPast ? 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 group-hover:dark:text-zinc-50' : ''}`}>{formatMonthLabel(month)}</span>
          {isCurrent && <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">current</span>}
        </div>
        <NumberFlow key={month} value={balance} format={currencyFormat} className={`${balanceClass} ${isLoading ? 'animate-pulse' : ''}`} />
      </div>
      <div className="flex gap-4 mt-1 text-sm text-zinc-500 dark:text-zinc-400 min-h-[1.25rem] sm:hidden">
        <span>Income <NumberFlow key={`${month}-income`} value={income} format={currencyFormat} className={`font-medium ${isLoading ? 'animate-pulse' : income > 0 ? 'text-green-600 dark:text-green-400' : 'text-zinc-400 dark:text-zinc-500'}`} /></span>
        <span>Expenses <NumberFlow key={`${month}-expenses`} value={expenses} format={currencyFormat} className={`font-medium ${isLoading ? 'animate-pulse' : expenses > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-400 dark:text-zinc-500'}`} /></span>
      </div>
      {/* sm+: single row */}
      <div className="hidden sm:flex sm:items-center sm:gap-4">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isPast ? 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 group-hover:dark:text-zinc-50' : ''}`}>{formatMonthLabel(month)}</span>
          {isCurrent && <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">current</span>}
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 min-h-[1.25rem]">
          <span>Income <NumberFlow key={`${month}-income-sm`} value={income} format={currencyFormat} className={`font-medium ${isLoading ? 'animate-pulse' : income > 0 ? 'text-green-600 dark:text-green-400' : 'text-zinc-400 dark:text-zinc-500'}`} /></span>
          <span>Expenses <NumberFlow key={`${month}-expenses-sm`} value={expenses} format={currencyFormat} className={`font-medium ${isLoading ? 'animate-pulse' : expenses > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-400 dark:text-zinc-500'}`} /></span>
        </div>
        <div className="ml-auto">
          <NumberFlow key={`${month}-sm`} value={balance} format={currencyFormat} className={`${balanceClass} ${isLoading ? 'animate-pulse' : ''}`} />
        </div>
      </div>
    </Link>
  )
}
