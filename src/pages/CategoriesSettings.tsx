import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import { categoriesCollection, transactionsCollection } from '../lib/collections'
import { supabase } from '../lib/supabase'

export default function CategoriesSettings() {
  const { data: categories = [] } = useLiveQuery((q) => q.from({ c: categoriesCollection }), [])
  const { data: allTx = [] } = useLiveQuery((q) => q.from({ tx: transactionsCollection }), [])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<'expense' | 'income'>('expense')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name))

  const startEdit = (cat: (typeof categories)[number]) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditType(cat.type as 'expense' | 'income')
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (id: number) => {
    await supabase.from('categories').update({ name: editName.trim(), type: editType }).eq('id', id)
    await categoriesCollection.utils.refetch()
    setEditingId(null)
  }

  const handleDelete = async (id: number) => {
    const inUse = allTx.some(tx => tx.category_id === id)
    if (inUse) {
      setDeletingId(id)
      return
    }
    await supabase.from('categories').delete().eq('id', id)
    await categoriesCollection.utils.refetch()
  }

  const confirmDelete = async (id: number) => {
    await supabase.from('categories').delete().eq('id', id)
    await categoriesCollection.utils.refetch()
    setDeletingId(null)
  }

  return (
    <div>
      <nav className="mb-2">
        <Link to="/settings" className="inline-flex items-center gap-1 text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Settings
        </Link>
      </nav>
      <h1 className="text-xl font-semibold mb-6">Categories</h1>

      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No categories.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map(cat => {
            const isEditing = editingId === cat.id
            const isConfirmingDelete = deletingId === cat.id
            const txCount = allTx.filter(tx => tx.category_id === cat.id).length

            if (isEditing) {
              return (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3"
                >
                  <select
                    value={editType}
                    onChange={e => setEditType(e.target.value as 'expense' | 'income')}
                    className="text-xs font-medium px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(cat.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="flex-1 text-sm bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none text-zinc-800 dark:text-zinc-200 py-0.5"
                  />
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={() => saveEdit(cat.id)}
                      className="text-sm px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-sm px-3 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            }

            if (isConfirmingDelete) {
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3"
                >
                  <p className="text-sm text-red-700 dark:text-red-400">
                    <span className="font-medium">{cat.name}</span> has {txCount} transaction{txCount !== 1 ? 's' : ''}. Delete anyway?
                  </p>
                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    <button
                      onClick={() => confirmDelete(cat.id)}
                      className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-sm px-3 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${cat.type === 'income' ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'}`}>
                    {cat.type === 'income' ? 'Income' : 'Expense'}
                  </span>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{cat.name}</p>
                  {txCount > 0 && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{txCount} tx</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(cat)}
                    className="text-sm px-3 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-sm px-3 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
