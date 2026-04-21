import { Link } from '@tanstack/react-router'

type MonthCardProps = {
  month: string
  income: number
  expenses: number
  balance: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function formatMonthLabel(month: string) {
  const [year, mon] = month.split('-').map(Number)
  return new Date(year, mon - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

export function MonthCard({ month, income, expenses, balance }: MonthCardProps) {
  return (
    <Link
      to="/month/$month"
      params={{ month }}
      className="block rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
    >
      <div className="flex justify-between items-center">
        <span className="font-medium">{formatMonthLabel(month)}</span>
        <span className={balance >= 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
          {formatCurrency(balance)}
        </span>
      </div>
      <div className="flex gap-4 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        <span>Income {formatCurrency(income)}</span>
        <span>Expenses {formatCurrency(expenses)}</span>
      </div>
    </Link>
  )
}
