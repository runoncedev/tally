import { useRef, useState } from 'react'
import type { Category, Transaction } from '../lib/collections'
import { transactionsCollection } from '../lib/collections'
import { supabase } from '../lib/supabase'

type TransactionFormProps = {
  tx?: Transaction
  categories: Category[]
  month: string
  categoriesById: Record<number, Category>
  prefillCategoryId?: number
  prefillCategoryType?: 'income' | 'expense'
  prefillAmount?: number
  prefillDescription?: string
  initialType?: 'income' | 'expense'
  publicId?: string
  focusOnMount?: boolean
  isRecurringPrefill?: boolean
  isRecurringCategory?: boolean
  recurringSourceId?: string
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


function txToForm(tx: Transaction): FormState {
  return {
    date: tx.date.slice(0, 10),
    amount: String(Math.abs(tx.amount)),
    category_id: tx.category_id,
    type: tx.amount >= 0 ? 'income' : 'expense',
    description: tx.description ?? '',
    recurrent: tx.recurrent,
  }
}

function emptyForm(month: string, prefillCategoryId?: number, prefillCategoryType?: 'income' | 'expense', prefillAmount?: number, prefillDescription?: string): FormState {
  return {
    date: `${month}-01`,
    amount: prefillAmount != null ? String(prefillAmount) : '',
    category_id: prefillCategoryId ?? null,
    type: prefillCategoryType ?? 'expense',
    description: prefillDescription ?? '',
    recurrent: false,
  }
}

export function TransactionForm({ tx, categories, month, categoriesById, prefillCategoryId, prefillCategoryType, prefillAmount, prefillDescription, initialType, publicId, focusOnMount = false, isRecurringPrefill = false, isRecurringCategory = false, recurringSourceId, onSaved, onDelete }: TransactionFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    tx ? txToForm(tx) : emptyForm(month, prefillCategoryId, prefillCategoryType ?? initialType, prefillAmount, prefillDescription)
  )
  const [isDirty, setIsDirty] = useState(false)
  const [isEditing, setIsEditing] = useState(!tx)
  const confirmDialogRef = useRef<HTMLDialogElement>(null)

  const patch = (p: Partial<FormState>) => {
    setForm(prev => ({ ...prev, ...p }))
    setIsDirty(true)
  }

  const type = form.type
  const filteredCategories = categories.filter(c => c.type === type)
  const canSave = (isDirty || isRecurringPrefill) && form.amount !== '' && form.category_id !== null

  const handleSave = async () => {
    if (!canSave) return
    const rawAmount = parseInt(form.amount, 10)
    if (isNaN(rawAmount)) return
    const amount = form.type === 'expense' ? -rawAmount : rawAmount

    const payload = {
      date: form.date,
      amount,
      category_id: form.category_id!,
      description: form.description || null,
      recurrent: form.recurrent,
    }

    if (tx) {
      if (tx.recurrent && !payload.recurrent) {
        await supabase.from('transactions').update({ recurring_source_id: null }).eq('recurring_source_id', tx.public_id)
      }
      transactionsCollection.update(tx.public_id, (draft) => {
        draft.date = payload.date
        draft.amount = payload.amount
        draft.category_id = payload.category_id
        draft.description = payload.description
        draft.recurrent = payload.recurrent
      })
      setIsDirty(false)
      setIsEditing(false)
    } else {
      transactionsCollection.insert({ ...payload, public_id: publicId ?? crypto.randomUUID(), recurring_source_id: recurringSourceId ?? null })
      onSaved?.()
    }
  }

  const handleCancel = () => {
    if (!tx) {
      onDelete?.()
    } else {
      setForm(txToForm(tx))
      setIsDirty(false)
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    if (!tx) return
    confirmDialogRef.current?.showModal()
  }

  const handleConfirmDelete = () => {
    confirmDialogRef.current?.close()
    if (!tx) return
    transactionsCollection.delete(tx.public_id)
    onDelete?.()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSave()
  }

  const formFields = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className={`text-sm font-medium px-2.5 py-1 rounded-lg shrink-0 ${type === 'income' ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'}`}>
            {type === 'income' ? 'Income' : 'Expense'}
          </span>
          <div className="relative min-w-0">
            <select
              value={form.category_id ?? ''}
              onChange={e => patch({ category_id: e.target.value ? Number(e.target.value) : null })}
              disabled={isRecurringCategory || isRecurringPrefill}
              className={`appearance-none bg-zinc-100 dark:bg-zinc-800 outline-none text-sm font-medium rounded-lg pl-3 pr-8 py-1.5 ${form.category_id === null ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'} ${isRecurringCategory || isRecurringPrefill ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <option value="" disabled>Category</option>
              {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
          </div>
        </div>
        {tx && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <span className="block sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-100 sm:delay-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
            </span>
          </button>
        )}
      </div>

      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-zinc-400 dark:text-zinc-500">$</span>
        <input
          type="text"
          inputMode="numeric"
          value={form.amount === '' ? '' : Number(form.amount).toLocaleString('en-US')}
          placeholder="0"
          autoFocus={focusOnMount}
          onChange={e => {
            const raw = e.target.value.replace(/,/g, '')
            if (raw === '' || /^\d+$/.test(raw)) patch({ amount: raw })
          }}
          className="bg-transparent outline-none text-2xl font-semibold w-full placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />
      </div>

      <input
        type="text"
        value={form.description}
        onChange={e => patch({ description: e.target.value })}
        placeholder="Note (optional)"
        className="bg-transparent outline-none text-sm text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2"
      />

      <div className="flex items-center justify-between gap-4 pt-1 h-8">
        <div>
          {(isRecurringPrefill || isRecurringCategory) && (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              <svg className="shrink-0" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
              Recurring
            </span>
          )}
          {!isRecurringPrefill && !isRecurringCategory && (
            <label className="flex items-center gap-2 cursor-pointer min-w-0">
              <input
                type="checkbox"
                checked={form.recurrent}
                onChange={e => patch({ recurrent: e.target.checked })}
                className="sr-only"
              />
              <div className={`relative w-9 h-5 shrink-0 rounded-full transition-colors ${form.recurrent ? 'bg-zinc-600 dark:bg-zinc-50' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 shadow transition-transform ${form.recurrent ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className={`text-sm truncate ${form.recurrent ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-600'}`}>Recurring {form.recurrent ? 'on' : 'off'}</span>
            </label>
          )}
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm px-3 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="text-sm px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 disabled:opacity-30 transition-opacity"
          >
            {tx ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </>
  )

  if (!tx) {
    return (
      <form onSubmit={handleSubmit} className="group rounded-xl border border-zinc-300 dark:border-zinc-700 p-4 flex flex-col gap-3 my-3 first:mt-0 last:mb-0">
        {formFields}
      </form>
    )
  }

  const isIncome = tx.amount >= 0
  const categoryName = tx.category_id ? categoriesById[tx.category_id]?.name : null

  return (
    <div className="group border border-zinc-300 dark:border-zinc-700 -mt-px first:mt-0 first:rounded-t-xl last:rounded-b-xl relative hover:z-10 overflow-hidden">
      <div style={{ interpolateSize: 'allow-keywords' } as React.CSSProperties}>
        <div
          className="overflow-hidden transition-[height] duration-300 ease-in-out"
          style={{ height: isEditing ? 0 : 'auto' }}
        >
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full p-4 flex items-center gap-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            {categoryName && (
              <span className="text-[15px] text-zinc-500 dark:text-zinc-400 shrink-0">{categoryName}</span>
            )}
            {tx.description && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600 shrink-0">·</span>
                <span className="text-[15px] text-zinc-400 dark:text-zinc-500 truncate min-w-0">{tx.description}</span>
              </>
            )}
            <span className={`text-[15px] font-semibold shrink-0 ml-auto ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {isIncome ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('en-US')}
            </span>
          </button>
        </div>
        <div
          className="overflow-hidden transition-[height] duration-300 ease-in-out"
          style={{ height: isEditing ? 'auto' : 0 }}
        >
          <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
            {formFields}
          </form>
        </div>
      </div>

      <dialog
        ref={confirmDialogRef}
        className="rounded-2xl p-6 w-80 bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 m-0"
      >
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-4">Delete transaction?</p>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-md shrink-0 ${tx.amount >= 0 ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'}`}>
              {tx.amount >= 0 ? 'Income' : 'Expense'}
            </span>
            {tx.category_id && <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{categoriesById[tx.category_id]?.name}</span>}
            {tx.description && <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">· {tx.description}</span>}
          </div>
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 shrink-0">
            ${Math.abs(tx.amount).toLocaleString('en-US')}
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">{tx.recurrent ? 'This will only delete this entry, not future ones.' : 'This action cannot be undone.'}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => confirmDialogRef.current?.close()}
            className="text-sm px-3 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            className="text-sm px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </dialog>
    </div>
  )
}
