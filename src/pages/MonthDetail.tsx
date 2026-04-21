import { useMemo, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useLiveQuery, eq, and, gte, lt } from '@tanstack/react-db'
import { transactionsCollection, categoriesCollection } from '../lib/collections'
import { TransactionRow } from '../components/TransactionRow'
import type { Category, Transaction } from '../types/app.types'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function formatMonthLabel(month: string) {
  const [year, mon] = month.split('-').map(Number)
  return new Date(year, mon - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

function adjacentMonth(month: string, delta: 1 | -1) {
  const [year, mon] = month.split('-').map(Number)
  const d = new Date(year, mon - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthDateRange(month: string) {
  const [year, mon] = month.split('-').map(Number)
  const start = `${year}-${String(mon).padStart(2, '0')}-01`
  const end = mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, '0')}-01`
  return { start, end }
}

function computeSummary(transactions: Transaction[], categoriesById: Record<number, Category>) {
  let income = 0, expenses = 0
  for (const tx of transactions) {
    if (tx.id < 0) continue // skip optimistic inserts
    const type = categoriesById[tx.category_id]?.type
    if (type === 'income') income += tx.amount
    else expenses += tx.amount
  }
  return { income, expenses, balance: income - expenses }
}

export default function MonthDetail() {
  const { month } = useParams({ from: '/month/$month' })
  const navigate = useNavigate()
  const currentMonth = new Date().toISOString().slice(0, 7)
  const now = new Date()
  const currentMonthLabel = `${now.getMonth() + 1}-${String(now.getFullYear()).slice(2)}`

  const navigateMonth = (m: string, direction: 'forward' | 'back') => {
    if (document.startViewTransition) {
      document.documentElement.dataset.navDirection = direction
      document.startViewTransition(() => navigate({ to: '/month/$month', params: { month: m } }))
    } else {
      navigate({ to: '/month/$month', params: { month: m } })
    }
  }
  const [newRowKeys, setNewRowKeys] = useState<number[]>([])

  const { start, end } = useMemo(() => monthDateRange(month), [month])

  const { data: monthTransactions = [] } = useLiveQuery(
    (q) => q.from({ tx: transactionsCollection }).where(({ tx }) => and(gte(tx.date, start), lt(tx.date, end))),
    [start, end],
  )

  const { data: allRecurring = [] } = useLiveQuery(
    (q) => q.from({ tx: transactionsCollection }).where(({ tx }) => eq(tx.recurrent, true)),
    [],
  )

  const { data: categories = [] } = useLiveQuery((q) => q.from({ c: categoriesCollection }), [])

  const transactions = (monthTransactions as unknown as Transaction[]).filter(tx => tx.id > 0)
  const categoriesById = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])
  const summary = useMemo(() => computeSummary(transactions, categoriesById), [transactions, categoriesById])

  const recurringPrefills = useMemo(() => {
    const existingCategoryIds = new Set(transactions.map(tx => tx.category_id))
    const seen = new Set<number>()
    return (allRecurring as unknown as Transaction[]).filter(tx => {
      if (existingCategoryIds.has(tx.category_id)) return false
      if (seen.has(tx.category_id)) return false
      seen.add(tx.category_id)
      return true
    })
  }, [transactions, allRecurring])

  const addRow = () => setNewRowKeys(prev => [...prev, Date.now()])
  const removeNewRow = (key: number) => setNewRowKeys(prev => prev.filter(k => k !== key))

  const hasNoData = transactions.length === 0 && recurringPrefills.length === 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 mr-2.5">
          <h1 className="text-xl font-semibold">{formatMonthLabel(month)}</h1>
          {month === currentMonth && <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">current</span>}
        </div>
        <div className="flex items-center">
          {month !== currentMonth && (
            <button
              onClick={() => navigateMonth(currentMonth, month < currentMonth ? 'forward' : 'back')}
              className="p-2.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold leading-none"
            >
              {currentMonthLabel}
            </button>
          )}
          <button
            onClick={() => navigateMonth(adjacentMonth(month, -1), 'back')}
            className="p-2.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button
            onClick={() => navigateMonth(adjacentMonth(month, 1), 'forward')}
            className="p-2.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div className="relative rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors p-2.5 ml-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
            <input
              type="month"
              value={month}
              onChange={e => navigate({ to: '/month/$month', params: { month: e.target.value } })}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div style={{ viewTransitionName: 'month-content' }}>
      <div className="mb-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Balance</p>
        <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {formatCurrency(summary.balance)}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Income <span className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(summary.income)}</span>
          {' · '}
          Expenses <span className="text-red-600 dark:text-red-400 font-medium">{formatCurrency(summary.expenses)}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {transactions.map(tx => (
          <TransactionRow
            key={tx.id}
            tx={tx as unknown as Transaction}
            categories={categories as unknown as Category[]}
            month={month}
            categoriesById={categoriesById}
          />
        ))}
        {recurringPrefills.map(tx => (
          <TransactionRow
            key={`recurring-${tx.category_id}`}
            categories={categories as unknown as Category[]}
            month={month}
            categoriesById={categoriesById}
            prefillCategoryId={tx.category_id}
            prefillCategoryType={(categoriesById[tx.category_id]?.type ?? 'expense') as 'income' | 'expense'}
            onSaved={() => {}}
          />
        ))}
        {newRowKeys.map(key => (
          <TransactionRow
            key={key}
            categories={categories as unknown as Category[]}
            month={month}
            categoriesById={categoriesById}
            onSaved={() => removeNewRow(key)}
          />
        ))}
        <button
          onClick={addRow}
          className={`w-full py-3 rounded-xl border text-sm transition-colors ${hasNoData && newRowKeys.length === 0 ? 'border-zinc-400 dark:border-zinc-500 text-zinc-600 dark:text-zinc-300 hover:border-zinc-600 dark:hover:border-zinc-300' : 'border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500'}`}
        >
          + Add transaction
        </button>
      </div>
      </div>
    </div>
  )
}
