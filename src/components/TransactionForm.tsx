import { useRef, useState } from 'react'
import { transactionsCollection } from '../lib/collections'
import type { Category, Transaction } from '../lib/collections'

type TransactionFormProps = {
  tx?: Transaction
  categories: Category[]
  month: string
  categoriesById: Record<number, Category>
  prefillCategoryId?: number
  prefillCategoryType?: 'income' | 'expense'
  initialType?: 'income' | 'expense'
  publicId?: string
  onSaved?: () => void
  onDelete?: () => void
}

type FormState = {
  date: string
  amount: string
  category_id: number | null
  type: 'income' | 'expense'
  description: string
  recurrent: boolean
}

function lastDayOfMonth(month: string) {
  const [year, mon] = month.split('-').map(Number)
  return new Date(year, mon, 0).toISOString().slice(0, 10)
}

function txToForm(tx: Transaction, categoriesById: Record<number, Category>): FormState {
  return {
    date: tx.date.slice(0, 10),
    amount: String(tx.amount),
    category_id: tx.category_id,
    type: (categoriesById[Number(tx.category_id)]?.type ?? 'expense') as 'income' | 'expense',
    description: tx.description ?? '',
    recurrent: tx.recurrent,
  }
}

function emptyForm(month: string, prefillCategoryId?: number, prefillCategoryType?: 'income' | 'expense'): FormState {
  return {
    date: `${month}-01`,
    amount: '',
    category_id: prefillCategoryId ?? null,
    type: prefillCategoryType ?? 'expense',
    description: '',
    recurrent: false,
  }
}

export function TransactionForm({ tx, categories, month, categoriesById, prefillCategoryId, prefillCategoryType, initialType, publicId, onSaved, onDelete }: TransactionFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    tx ? txToForm(tx, categoriesById) : emptyForm(month, prefillCategoryId, prefillCategoryType ?? initialType)
  )
  const [isDirty, setIsDirty] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const patch = (p: Partial<FormState>) => {
    setForm(prev => ({ ...prev, ...p }))
    setIsDirty(true)
  }

  const type = tx
    ? (categoriesById[Number(tx.category_id)]?.type ?? form.type) as 'income' | 'expense'
    : form.type
  const filteredCategories = categories.filter(c => c.type === type)
  const canSave = isDirty && form.amount !== '' && form.category_id !== null

  const handleSave = async () => {
    if (!canSave) return
    const amount = parseInt(form.amount, 10)
    if (isNaN(amount)) return

    const payload = {
      date: form.date,
      amount,
      category_id: form.category_id!,
      description: form.description || null,
      recurrent: form.recurrent,
    }

    if (tx) {
      transactionsCollection.update(tx.public_id, (draft) => {
        draft.date = payload.date
        draft.amount = payload.amount
        draft.category_id = payload.category_id
        draft.description = payload.description
        draft.recurrent = payload.recurrent
      })
      setIsDirty(false)
    } else {
      transactionsCollection.insert({ ...payload, public_id: publicId ?? crypto.randomUUID() })
      onSaved?.()
    }
  }

  const handleCancel = () => {
    if (!tx) {
      onDelete?.()
    } else {
      setForm(txToForm(tx, categoriesById))
      setIsDirty(false)
    }
  }

  const handleDelete = async () => {
    if (!tx) return
    if (tx.recurrent && !confirm('This is a recurring transaction. Are you sure you want to delete it?')) return
    transactionsCollection.delete(tx.public_id)
    onDelete?.()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSave()
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-3">
      <div className="flex justify-between">
        <span className={`text-sm font-medium px-2.5 py-1 rounded-lg ${type === 'income' ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'}`}>
          {type === 'income' ? 'Income' : 'Expense'}
        </span>

        <div className="relative">
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker()}
            className="flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            {new Date(form.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={form.date}
            min={`${month}-01`}
            max={lastDayOfMonth(month)}
            onChange={e => patch({ date: e.target.value })}
            className="absolute inset-0 opacity-0 pointer-events-none w-full"
          />
        </div>
      </div>

      <div className="flex items-baseline gap-1 border border-zinc-100 dark:border-zinc-800 rounded-lg px-3 py-2">
        <span className="text-2xl font-semibold text-zinc-400 dark:text-zinc-500">$</span>
        <input
          type="text"
          inputMode="numeric"
          value={form.amount === '' ? '' : Number(form.amount).toLocaleString('en-US')}
          placeholder="0"
          autoFocus={!tx}
          onChange={e => {
            const raw = e.target.value.replace(/,/g, '')
            if (raw === '' || /^\d+$/.test(raw)) patch({ amount: raw })
          }}
          className="bg-transparent outline-none text-2xl font-semibold w-full placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />
      </div>

      <div className="relative">
        <select
          value={form.category_id ?? ''}
          onChange={e => patch({ category_id: e.target.value ? Number(e.target.value) : null })}
          className={`w-full appearance-none bg-zinc-100 dark:bg-zinc-800 outline-none text-sm rounded-lg pl-3 pr-8 py-2 ${form.category_id === null ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-600 dark:text-zinc-300'}`}
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
            checked={form.recurrent}
            onChange={e => patch({ recurrent: e.target.checked })}
            className="sr-only"
          />
          <div className={`relative w-9 h-5 rounded-full transition-colors ${form.recurrent ? 'bg-zinc-900 dark:bg-zinc-50' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 shadow transition-transform ${form.recurrent ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Recurring {form.recurrent ? 'on' : 'off'}</span>
        </label>
        <div className="flex gap-2">
          {tx && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-sm px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              Delete
            </button>
          )}
          {!prefillCategoryId && (isDirty || !tx) && (
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm px-3 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!canSave}
            className="text-sm px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 disabled:opacity-30 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  )
}
