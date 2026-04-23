import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useLiveQuery, eq } from '@tanstack/react-db'
import { transactionsCollection, categoriesCollection } from '../lib/collections'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export default function RecurringSettings() {
  const { data: allTransactions = [] } = useLiveQuery(
    (q) => q.from({ tx: transactionsCollection }).where(({ tx }) => eq(tx.recurrent, true)),
    [],
  )
  const { data: allTx = [] } = useLiveQuery((q) => q.from({ tx: transactionsCollection }), [])
  const { data: categories = [] } = useLiveQuery((q) => q.from({ c: categoriesCollection }), [])
  const categoriesById = Object.fromEntries(categories.map(c => [c.id, c]))

  const [sortBy, setSortBy] = useState<'type' | 'name' | 'amount'>('type')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all')

  const toggleSort = (field: 'name' | 'amount' | 'type') => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir(field === 'amount' ? 'desc' : 'asc') }
  }

  const seen = new Set<number>()
  const recurring = allTransactions
    .filter((tx): tx is typeof tx & { category_id: number } => {
      if (tx.category_id == null) return false
      if (seen.has(tx.category_id)) return false
      seen.add(tx.category_id)
      return true
    })
    .filter(tx => {
      if (filterType === 'all') return true
      return (categoriesById[tx.category_id]?.type ?? 'expense') === filterType
    })
    .sort((a, b) => {
      const catA = categoriesById[a.category_id]
      const catB = categoriesById[b.category_id]
      let cmp = 0
      if (sortBy === 'name') cmp = (catA?.name ?? '').localeCompare(catB?.name ?? '')
      else if (sortBy === 'amount') cmp = Math.abs(a.amount) - Math.abs(b.amount)
      else if (sortBy === 'type') cmp = (catA?.type ?? '').localeCompare(catB?.type ?? '')
      return sortDir === 'asc' ? cmp : -cmp
    })

  const handleStopRecurring = (publicId: string) => {
    transactionsCollection.update(publicId, (draft) => {
      draft.recurrent = false
    })
    allTx
      .filter(tx => tx.recurring_source_id === publicId)
      .forEach(tx => transactionsCollection.update(tx.public_id, (draft) => {
        draft.recurring_source_id = null
      }))
  }

  return (
    <div>
      <nav className="mb-2">
        <Link to="/settings" className="inline-flex items-center gap-1 text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Settings
        </Link>
      </nav>
      <h1 className="text-xl font-semibold mb-4">Recurring transactions</h1>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs">
          {(['all', 'expense', 'income'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 transition-colors ${filterType === t ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
            >
              {t === 'all' ? 'All' : t === 'expense' ? 'Expenses' : 'Income'}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs ml-auto">
          {(['type', 'name', 'amount'] as const).map(field => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`px-3 py-1.5 flex items-center gap-1 transition-colors ${sortBy === field ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
            >
              {field === 'name' ? 'Category' : field === 'amount' ? 'Amount' : 'Type'}
              {sortBy === field && (
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {sortDir === 'asc' ? <path d="M12 19V5M5 12l7-7 7 7"/> : <path d="M12 5v14M5 12l7 7 7-7"/>}
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {recurring.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No recurring transactions.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {recurring.map(tx => {
            const category = categoriesById[tx.category_id]
            const type = category?.type ?? 'expense'
            return (
              <div
                key={tx.public_id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${type === 'income' ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'}`}>
                    {type === 'income' ? 'Income' : 'Expense'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{category?.name ?? '—'}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatCurrency(tx.amount)}</p>
                      <Link
                        to="/month/$month"
                        params={{ month: tx.date.slice(0, 7) }}
                        className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 underline underline-offset-2"
                      >
                        {tx.date.slice(0, 7)}
                      </Link>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleStopRecurring(tx.public_id)}
                  className="text-sm px-3 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Stop recurring
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
