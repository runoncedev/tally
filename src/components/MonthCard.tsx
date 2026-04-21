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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function formatMonthLabel(month: string) {
  const [year, mon] = month.split('-').map(Number)
  return new Date(year, mon - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

export function MonthCard({ month, income, expenses, balance, isCurrent, isPast, isLoading }: MonthCardProps) {
  return (
    <Link
      to="/month/$month"
      params={{ month }}
      className={`group block rounded-xl border p-4 transition-colors ${isPast ? 'border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isPast ? 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 group-hover:dark:text-zinc-50' : ''}`}>{formatMonthLabel(month)}</span>
          {isCurrent && <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">current</span>}
        </div>
        {isLoading
          ? <svg className="animate-spin text-zinc-400 dark:text-zinc-600" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          : <span className={balance >= 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>{formatCurrency(balance)}</span>
        }
      </div>
      <div className="flex gap-4 mt-1 text-sm text-zinc-500 dark:text-zinc-400 min-h-[1.25rem]">
        {!isLoading && (
          <>
            <span>Income <span className={income > 0 ? 'text-green-600 dark:text-green-400 font-medium' : ''}>{formatCurrency(income)}</span></span>
            <span>Expenses <span className={expenses > 0 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>{formatCurrency(expenses)}</span></span>
          </>
        )}
      </div>
    </Link>
  )
}
