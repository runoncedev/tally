import type { Category, DraftRow } from '../types/app.types'

type TransactionRowProps = {
  row: DraftRow
  categories: Category[]
  month: string
  onChange: (patch: Partial<DraftRow>) => void
  onSave: () => void
  onDelete: () => void
}

function lastDayOfMonth(month: string) {
  const [year, mon] = month.split('-').map(Number)
  return new Date(year, mon, 0).toISOString().slice(0, 10)
}

export function TransactionRow({ row, categories, month, onChange, onSave, onDelete }: TransactionRowProps) {
  const filteredCategories = categories.filter(c => c.type === row.type)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSave()
  }

  const canSave = row.isDirty && row.amount !== '' && row.category_id !== ''

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-3">
      <div className="flex justify-between">
        <select
          value={row.type}
          onChange={e => onChange({ type: e.target.value as 'income' | 'expense', category_id: '', isDirty: true })}
          className={`bg-transparent outline-none text-sm font-medium ${row.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <input
          type="date"
          value={row.date}
          min={`${month}-01`}
          max={lastDayOfMonth(month)}
          onChange={e => onChange({ date: e.target.value, isDirty: true })}
          onKeyDown={handleKeyDown}
          className="bg-transparent outline-none text-sm text-zinc-500 dark:text-zinc-400"
        />
      </div>

      <div className="flex items-baseline gap-1 border border-zinc-100 dark:border-zinc-800 rounded-lg px-3 py-2">
        <span className="text-2xl font-semibold text-zinc-400 dark:text-zinc-500">$</span>
        <input
          type="number"
          step="0.01"
          value={row.amount}
          placeholder="0.00"
          onChange={e => onChange({ amount: e.target.value, isDirty: true })}
          onKeyDown={handleKeyDown}
          className="bg-transparent outline-none text-2xl font-semibold w-full placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />
      </div>

      <div className="relative">
        <select
          value={row.category_id}
          onChange={e => onChange({ category_id: e.target.value ? Number(e.target.value) : '', isDirty: true })}
          onKeyDown={handleKeyDown}
          className={`w-full appearance-none bg-zinc-100 dark:bg-zinc-800 outline-none text-sm rounded-lg pl-3 pr-8 py-2 ${row.category_id === '' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-600 dark:text-zinc-300'}`}
        >
          <option value="" disabled>Category</option>
          {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={row.recurrent}
            onChange={e => onChange({ recurrent: e.target.checked, isDirty: true })}
            className="sr-only"
          />
          <div className={`relative w-9 h-5 rounded-full transition-colors ${row.recurrent ? 'bg-zinc-900 dark:bg-zinc-50' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 shadow transition-transform ${row.recurrent ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Recurring {row.recurrent ? 'on' : 'off'}</span>
        </label>
        <div className="flex gap-2">
          {row.id && (
            <button
              onClick={onDelete}
              className="text-sm px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              Delete
            </button>
          )}
          <button
            onClick={onSave}
            disabled={!canSave}
            className="text-sm px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 disabled:opacity-30 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
