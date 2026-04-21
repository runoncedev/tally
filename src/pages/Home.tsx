import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchAllTransactions, fetchCategories } from '../lib/queries'
import { MonthCard } from '../components/MonthCard'
import type { Category, Transaction } from '../types/app.types'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function buildMonthSummaries(transactions: Transaction[], categoriesById: Record<number, Category>) {
  const months: Record<string, { income: number; expenses: number }> = {}
  for (const tx of transactions) {
    const month = tx.date.slice(0, 7)
    if (!months[month]) months[month] = { income: 0, expenses: 0 }
    const type = categoriesById[tx.category_id]?.type
    if (type === 'income') months[month].income += tx.amount
    else months[month].expenses += tx.amount
  }
  return Object.entries(months)
    .map(([month, { income, expenses }]) => ({ month, income, expenses, balance: income - expenses }))
    .sort((a, b) => b.month.localeCompare(a.month))
}

export default function Home() {
  const { data: transactions = [] } = useQuery({ queryKey: ['transactions', 'all'], queryFn: fetchAllTransactions })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })

  const categoriesById = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])
  const months = useMemo(() => buildMonthSummaries(transactions, categoriesById), [transactions, categoriesById])
  const totalBalance = useMemo(() => months.reduce((sum, m) => sum + m.balance, 0), [months])
  const currentMonth = new Date().toISOString().slice(0, 7)

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Total balance</p>
        <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {formatCurrency(totalBalance)}
        </p>
      </div>

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
          {months.map(m => <MonthCard key={m.month} {...m} />)}
        </div>
      )}
    </div>
  )
}
