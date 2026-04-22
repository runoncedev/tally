import { useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useLiveQuery, eq, and, gte, lt } from '@tanstack/react-db'
import { transactionsCollection, categoriesCollection } from '../lib/collections'
import { TransactionForm } from '../components/TransactionForm'
import type { Transaction } from '../lib/collections'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
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

function computeSummary(transactions: Transaction[]) {
  let income = 0, expenses = 0
  for (const tx of transactions) {
    if (tx.amount >= 0) income += tx.amount
    else expenses += Math.abs(tx.amount)
  }
  return { income, expenses, balance: income - expenses }
}

export default function MonthDetail() {
  const { month } = useParams({ from: '/month/$month' })
  const navigate = useNavigate()
  const currentMonth = new Date().toISOString().slice(0, 7)
  const now = new Date()
  const currentMonthLabel = `${now.getMonth() + 1}-${String(now.getFullYear()).slice(2)}`

  const navigateMonth = (e: React.MouseEvent, m: string, direction: 'forward' | 'back') => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    if (document.startViewTransition) {
      document.documentElement.dataset.navDirection = direction
      document.startViewTransition(() => navigate({ to: '/month/$month', params: { month: m } }))
    } else {
      navigate({ to: '/month/$month', params: { month: m } })
    }
  }

  const monthPickerRef = useRef<HTMLInputElement>(null)
  const [newRows, setNewRows] = useState<{ publicId: string; type: 'income' | 'expense' }[]>([])
  const [recurringExpanded, setRecurringExpanded] = useState(false)

  const { start, end } = useMemo(() => monthDateRange(month), [month])

  const { data: monthTransactions = [], isLoading: txLoading } = useLiveQuery(
    (q) => q.from({ tx: transactionsCollection }).where(({ tx }) => and(gte(tx.date, start), lt(tx.date, end))).orderBy(({ tx }) => tx.created_at, 'desc'),
    [start, end],
  )

  const { data: allRecurring = [] } = useLiveQuery(
    (q) => q.from({ tx: transactionsCollection }).where(({ tx }) => eq(tx.recurrent, true)).orderBy(({ tx }) => tx.created_at, 'desc'),
    [],
  )

  const { data: categories = [], isLoading: categoriesLoading } = useLiveQuery((q) => q.from({ c: categoriesCollection }), [])

  const isLoading = txLoading || categoriesLoading

  const transactions = monthTransactions
  const categoriesById = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])
  const summary = useMemo(() => computeSummary(transactions), [transactions])
  const activeRecurringIds = useMemo(() => new Set(allRecurring.map(tx => tx.public_id)), [allRecurring])
  const regularTransactions = useMemo(() => transactions.filter(tx => !tx.recurring_source_id || !activeRecurringIds.has(tx.recurring_source_id)), [transactions, activeRecurringIds])
  const recurringTransactions = useMemo(() => transactions.filter(tx => tx.recurring_source_id && activeRecurringIds.has(tx.recurring_source_id)), [transactions, activeRecurringIds])


const recurringPrefills = useMemo(() => {
    const completedRecurringIds = new Set(transactions.map(tx => tx.recurring_source_id).filter(Boolean))
    const existingPublicIds = new Set(transactions.map(tx => tx.public_id))
    const seen = new Set<string>()
    return allRecurring.filter(tx => {
      if (tx.date.slice(0, 7) > month) return false
      if (completedRecurringIds.has(tx.public_id)) return false
      if (existingPublicIds.has(tx.public_id)) return false
      if (seen.has(tx.public_id)) return false
      seen.add(tx.public_id)
      return true
    })
  }, [transactions, allRecurring, month])

  const addRow = (type: 'income' | 'expense') =>
    setNewRows(prev => [{ publicId: crypto.randomUUID(), type }, ...prev])
  const removeRow = (publicId: string) =>
    setNewRows(prev => prev.filter(r => r.publicId !== publicId))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 mr-2.5">
          <h1 className="text-xl font-semibold">{formatMonthLabel(month)}</h1>
          {month === currentMonth && <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">current</span>}
        </div>
        <div className="flex items-center">
          {month !== currentMonth && (
            <a
              href={`/month/${currentMonth}`}
              onClick={(e) => navigateMonth(e, currentMonth, month < currentMonth ? 'forward' : 'back')}
              title="Go to current month"
              className="p-2.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold leading-none"
            >
              {currentMonthLabel}
            </a>
          )}
          <a
            href={`/month/${adjacentMonth(month, -1)}`}
            onClick={(e) => navigateMonth(e, adjacentMonth(month, -1), 'back')}
            title={formatMonthLabel(adjacentMonth(month, -1))}
            className="p-2.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </a>
          <a
            href={`/month/${adjacentMonth(month, 1)}`}
            onClick={(e) => navigateMonth(e, adjacentMonth(month, 1), 'forward')}
            title={formatMonthLabel(adjacentMonth(month, 1))}
            className="p-2.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
          <div className="relative ml-1.5">
            <button
              onClick={() => monthPickerRef.current?.showPicker()}
              title="Pick a month"
              className="p-2.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>
            <input
              ref={monthPickerRef}
              type="month"
              value={month}
              onChange={e => {
                const m = e.target.value
                if (document.startViewTransition) {
                  document.documentElement.dataset.navDirection = m >= month ? 'forward' : 'back'
                  document.startViewTransition(() => navigate({ to: '/month/$month', params: { month: m } }))
                } else {
                  navigate({ to: '/month/$month', params: { month: m } })
                }
              }}
              className="absolute inset-0 opacity-0 pointer-events-none w-full"
            />
          </div>
        </div>
      </div>

      <div style={{ viewTransitionName: 'month-content' }}>
      <>
      <div className="mb-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Balance</p>
        <p className={`text-3xl font-bold h-10 flex items-center ${summary.balance > 0 ? 'text-green-600 dark:text-green-400' : summary.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
          {isLoading ? <span className="inline-block w-28 h-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" /> : formatCurrency(summary.balance)}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 h-5">
          {!isLoading && <>
            Income <span className={summary.income > 0 ? 'text-green-600 dark:text-green-400 font-medium' : ''}>{formatCurrency(summary.income)}</span>
            {' · '}
            Expenses <span className={summary.expenses > 0 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>{formatCurrency(summary.expenses)}</span>
          </>}
        </p>
      </div>

      <div className="flex gap-2 mb-6 sm:justify-start">
          <button
            onClick={() => addRow('income')}
            className="flex-1 sm:flex-none sm:w-36 py-2 rounded-xl border text-sm transition-colors border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 dark:text-green-400"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 19 19 12"/></svg>
            Add income
          </button>
          <button
            onClick={() => addRow('expense')}
            className="flex-1 sm:flex-none sm:w-36 py-2 rounded-xl border text-sm transition-colors border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 dark:text-red-400"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 5 5 12"/></svg>
            Add expense
          </button>
        </div>

      <div className="flex flex-col gap-3">
        {newRows.map(row => (
          <TransactionForm
            key={row.publicId}
            categories={categories}
            month={month}
            categoriesById={categoriesById}
            initialType={row.type}
            publicId={row.publicId}
            focusOnMount
            onSaved={() => removeRow(row.publicId)}
            onDelete={() => removeRow(row.publicId)}
          />
        ))}
        {regularTransactions.map(tx => (
          <TransactionForm
            key={tx.public_id}
            tx={tx}
            categories={categories}
            month={month}
            categoriesById={categoriesById}
          />
        ))}
        {(recurringPrefills.length > 0 || recurringTransactions.length > 0) && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3 h-10">
              <div className="flex items-center gap-3">
                <span className="text-xl font-semibold text-zinc-700 dark:text-zinc-200">Recurring</span>
                <button
                  type="button"
                  onClick={() => setRecurringExpanded(e => !e)}
                  className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${recurringExpanded ? '' : 'rotate-180'}`}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 tracking-widest">{recurringTransactions.length}/{recurringTransactions.length + recurringPrefills.length}</span>
              {recurringPrefills.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    recurringPrefills.forEach(tx => {
                      transactionsCollection.insert({
                        public_id: crypto.randomUUID(),
                        date: `${month}-01`,
                        amount: tx.amount,
                        category_id: tx.category_id,
                        description: tx.description ?? null,
                        recurrent: false,
                        recurring_source_id: tx.public_id,
                      })
                    })
                  }}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:opacity-80 transition-opacity"
                >
                  Add all
                </button>
              )}
              </div>
            </div>
            {recurringExpanded && <div className="flex flex-col gap-3">
                {recurringPrefills.map(tx => (
                  <TransactionForm
                    key={`recurring-${tx.public_id}`}
                    categories={categories}
                    month={month}
                    categoriesById={categoriesById}
                    prefillCategoryId={tx.category_id}
                    prefillCategoryType={tx.amount >= 0 ? 'income' : 'expense'}
                    prefillAmount={Math.abs(tx.amount)}
                    prefillDescription={tx.description ?? undefined}
                    isRecurringPrefill
                    recurringSourceId={tx.public_id}
                    onSaved={() => {}}
                  />
                ))}
                {recurringTransactions.map(tx => (
                  <TransactionForm
                    key={tx.public_id}
                    tx={tx}
                    categories={categories}
                    month={month}
                    categoriesById={categoriesById}
                    isRecurringCategory
                  />
                ))}
            </div>}
          </div>
        )}
      </div>
      </>
      </div>
    </div>
  )
}
