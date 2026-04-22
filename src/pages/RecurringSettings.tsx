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
  const { data: categories = [] } = useLiveQuery((q) => q.from({ c: categoriesCollection }), [])
  const categoriesById = Object.fromEntries(categories.map(c => [c.id, c]))

  const seen = new Set<number>()
  const recurring = allTransactions.filter(tx => {
    if (seen.has(tx.category_id)) return false
    seen.add(tx.category_id)
    return true
  })

  const handleDelete = (publicId: string) => {
    transactionsCollection.delete(publicId)
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Recurring transactions</h1>

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
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatCurrency(tx.amount)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(tx.public_id)}
                  className="text-sm px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  Delete
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
