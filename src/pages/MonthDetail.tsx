import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMonthTransactions, fetchCategories, fetchRecurringTransactions, insertTransaction, updateTransaction, deleteTransaction } from '../lib/queries'
import { TransactionRow } from '../components/TransactionRow'
import type { Category, DraftRow, Transaction } from '../types/app.types'

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

function emptyRow(month: string): DraftRow {
  return { date: `${month}-01`, amount: '', category_id: '', type: 'expense', description: '', recurrent: false, isDirty: false }
}

function txToDraft(tx: Transaction, categoriesById: Record<number, Category>): DraftRow {
  return {
    id: tx.id,
    date: tx.date.slice(0, 10),
    amount: String(tx.amount),
    category_id: tx.category_id,
    type: (categoriesById[tx.category_id]?.type ?? 'expense') as 'income' | 'expense',
    description: tx.description ?? '',
    recurrent: tx.recurrent,
    isDirty: false,
  }
}

function buildInitialRows(transactions: Transaction[], recurring: Transaction[], month: string, categoriesById: Record<number, Category>): DraftRow[] {
  const existingCategoryIds = new Set(transactions.filter(tx => tx.recurrent).map(tx => tx.category_id))
  const missingRecurring = recurring.filter(tx => !existingCategoryIds.has(tx.category_id))
  const recurringDrafts: DraftRow[] = missingRecurring.map(tx => ({
    date: `${month}-01`,
    amount: '',
    category_id: tx.category_id,
    type: (categoriesById[tx.category_id]?.type ?? 'expense') as 'income' | 'expense',
    description: '',
    recurrent: false,
    isDirty: false,
  }))
  return [...transactions.map(tx => txToDraft(tx, categoriesById)), ...recurringDrafts]
}

function computeSummary(rows: DraftRow[], categoriesById: Record<number, Category>) {
  let income = 0, expenses = 0
  for (const row of rows) {
    if (!row.id || !row.amount || row.category_id === '') continue
    const type = categoriesById[row.category_id]?.type
    const amount = parseFloat(row.amount)
    if (type === 'income') income += amount
    else expenses += amount
  }
  return { income, expenses, balance: income - expenses }
}

export default function MonthDetail() {
  const { month } = useParams({ from: '/month/$month' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<DraftRow[]>([])

  const { data: transactions } = useQuery({ queryKey: ['transactions', month], queryFn: () => fetchMonthTransactions(month) })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })
  const { data: recurring = [] } = useQuery({ queryKey: ['transactions', 'recurring'], queryFn: fetchRecurringTransactions, staleTime: 0 })

  const categoriesById = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])
  const summary = useMemo(() => computeSummary(rows, categoriesById), [rows, categoriesById])

  useEffect(() => {
    if (!transactions || categories.length === 0) return
    setRows(buildInitialRows(transactions, recurring, month, categoriesById))
  }, [month, transactions, recurring, categories])

  const addRow = () => setRows(prev => [...prev, emptyRow(month)])

  const updateRow = (index: number, patch: Partial<DraftRow>) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, ...patch } : r))
  }

  const deleteRow = async (index: number) => {
    const row = rows[index]
    if (!row.id) return
    const savedTx = transactions?.find(tx => tx.id === row.id)
    if (savedTx?.recurrent && !confirm('This is a recurring transaction. Are you sure you want to delete it?')) return
    await deleteTransaction(row.id)
    setRows(prev => prev.filter((_, i) => i !== index))
    queryClient.invalidateQueries({ queryKey: ['transactions', month] })
    queryClient.invalidateQueries({ queryKey: ['transactions', 'all'] })
  }

  const saveRow = async (index: number) => {
    const row = rows[index]
    if (!row.amount || row.category_id === '') return
    const amount = parseFloat(row.amount)
    if (isNaN(amount)) return

    const payload = {
      date: new Date(row.date).toISOString(),
      amount,
      category_id: row.category_id as number,
      description: row.description || null,
      recurrent: row.recurrent,
    }

    const saved = row.id
      ? await updateTransaction(row.id, payload)
      : await insertTransaction(payload)

    setRows(prev => prev.map((r, i) => i === index ? txToDraft(saved, categoriesById) : r))
    queryClient.invalidateQueries({ queryKey: ['transactions', month] })
    queryClient.invalidateQueries({ queryKey: ['transactions', 'all'] })
  }

  return (
    <div>
      <div className="flex items-center justify-between sm:justify-start mb-6">
        <h1 className="text-xl font-semibold mr-2.5">{formatMonthLabel(month)}</h1>
        <div className="flex items-center">
          <button
            onClick={() => navigate({ to: '/month/$month', params: { month: adjacentMonth(month, -1) } })}
            className="p-1 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button
            onClick={() => navigate({ to: '/month/$month', params: { month: adjacentMonth(month, 1) } })}
            className="p-1 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div className="relative rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors p-1 ml-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
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

      <div className="flex gap-6 mb-8">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Income</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{formatCurrency(summary.income)}</p>
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Expenses</p>
          <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{formatCurrency(summary.expenses)}</p>
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Balance</p>
          <p className={`text-2xl font-semibold ${summary.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(summary.balance)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <TransactionRow
            key={i}
            row={row}
            categories={categories}
            month={month}
            onChange={patch => updateRow(i, patch)}
            onSave={() => saveRow(i)}
            onDelete={() => deleteRow(i)}
          />
        ))}
        <button
          onClick={addRow}
          className={`w-full py-3 rounded-xl border text-sm transition-colors ${(transactions ?? []).length === 0 && recurring.length === 0 ? 'border-zinc-400 dark:border-zinc-500 text-zinc-600 dark:text-zinc-300 hover:border-zinc-600 dark:hover:border-zinc-300' : 'border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500'}`}
        >
          + Add transaction
        </button>
      </div>
    </div>
  )
}
