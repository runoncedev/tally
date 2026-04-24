import { useLiveQuery } from '@tanstack/react-db'
import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { MonthCard } from '../components/MonthCard'
import { categoriesCollection, transactionsCollection } from '../lib/collections'
import type { Category, Transaction } from '../lib/collections'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function formatMonthShort(month: string) {
  const [year, mon] = month.split('-').map(Number)
  return new Date(year, mon - 1).toLocaleString('default', { month: 'short' })
}

function TrendChart({ months }: { months: Array<{ month: string; income: number; expenses: number }> }) {
  if (months.length < 2) return null
  const chronological = [...months].sort((a, b) => b.month.localeCompare(a.month))
  const max = Math.max(...chronological.map(m => Math.abs(m.income - m.expenses)), 1)
  return (
    <div className="mt-6 hidden lg:flex flex-col gap-1.5">
      {chronological.map(m => {
        const balance = m.income - m.expenses
        const zero = balance === 0
        const positive = balance > 0
        const pct = Math.max((Math.abs(balance) / max) * 100, 0)
        const bg = zero ? 'rgb(113 113 122 / 0.4)' : positive ? 'rgb(34 197 94 / 0.75)' : 'rgb(239 68 68 / 0.75)'
        const label = formatMonthShort(m.month)
        const amount = formatCurrency(balance)
        return (
          <Link
            key={m.month}
            to="/month/$month"
            params={{ month: m.month }}
            className="h-6 rounded flex items-center justify-between px-2 overflow-hidden hover:brightness-110 transition-[filter]"
            style={{ width: zero ? '64px' : `max(${pct}%, 110px)`, backgroundColor: bg, transition: 'width 0.3s ease' }}
          >
            <span className="text-[11px] font-medium text-white/80 shrink-0">{label}</span>
            <span className="text-[11px] font-medium text-white/80 shrink-0 ml-2">{amount}</span>
          </Link>
        )
      })}
    </div>
  )
}

function buildMonthSummaries(transactions: Array<Transaction>) {
  const months: Record<string, { income: number; expenses: number }> = {}
  for (const tx of transactions) {
    const month = tx.date.slice(0, 7)
    if (!months[month]) months[month] = { income: 0, expenses: 0 }
    if (tx.amount >= 0) months[month].income += tx.amount
    else months[month].expenses += Math.abs(tx.amount)
  }
  return Object.entries(months)
    .map(([month, { income, expenses }]) => ({ month, income, expenses, balance: income - expenses }))
    .sort((a, b) => b.month.localeCompare(a.month))
}

export default function Home() {
  const { data: transactions = [], isLoading } = useLiveQuery((q) => q.from({ tx: transactionsCollection }), [])
  const { data: categories = [] } = useLiveQuery((q) => q.from({ c: categoriesCollection }), [])

  const today = new Date()
  const currentMonth = today.toISOString().slice(0, 7)
  const isAfterMidMonth = today.getDate() > 15
  const nextMonth = (() => {
    const d = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    return d.toISOString().slice(0, 7)
  })()

  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  )

  const months = useMemo(() => {
    const summaries = buildMonthSummaries(transactions)
    if (!summaries.find((m) => m.month === currentMonth)) {
      summaries.push({ month: currentMonth, income: 0, expenses: 0, balance: 0 })
    }
    if (isAfterMidMonth && !summaries.find((m) => m.month === nextMonth)) {
      summaries.push({ month: nextMonth, income: 0, expenses: 0, balance: 0 })
    }
    return summaries.sort((a, b) => b.month.localeCompare(a.month))
  }, [transactions, currentMonth, isAfterMidMonth, nextMonth])

  const totalBalance = useMemo(() => months.reduce((sum, m) => sum + m.balance, 0), [months])

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Total balance</p>
        {isLoading
          ? <div className="h-[2.25rem] w-32 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          : <p className={`text-3xl font-bold ${totalBalance > 0 ? 'text-green-600 dark:text-green-400' : totalBalance < 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400'}`}>{formatCurrency(totalBalance)}</p>
        }
        {/* {!isLoading && <TrendChart months={months} />} */}
      </div>

      <div>
        {months.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 dark:text-zinc-500">
            <p className="mb-4">No transactions yet.</p>
            <Link
              to="/month/$month"
              params={{ month: currentMonth }}
              className="text-zinc-900 dark:text-zinc-50 underline underline-offset-4"
            >
              Go to {currentMonth} to add your first transaction
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {months.map((m, i) => {
              const prevMonth = months[i - 1]
              const showDivider = prevMonth && prevMonth.month >= currentMonth && m.month < currentMonth
              return (
                <>
                  {showDivider && (
                    <div key="divider" className="flex items-center gap-3 my-2">
                      <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800/60" />
                      <span className="text-xs text-zinc-300 dark:text-zinc-700">History</span>
                      <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800/60" />
                    </div>
                  )}
                  <MonthCard key={m.month} {...m} isCurrent={m.month === currentMonth} isPast={m.month < currentMonth} isLoading={isLoading && m.month >= currentMonth} />
                </>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
